terraform {
  required_providers {
    hcloud = {
      source = "hetznercloud/hcloud"
      version = ">= 1.42.0"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "The domain name for the backend HTTPS endpoint (e.g., dev.batikanor.com)"
  type        = string
}

variable "ssh_private_key_path" {
  description = "Path to the SSH private key for server provisioning"
  type        = string
}

variable "server_name" {
  description = "The name of the Hetzner server"
  type        = string
}

variable "OPENAI_API_KEY" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
}

# Example server resource (customize as needed)
resource "hcloud_server" "backend" {
  name        = var.server_name
  server_type = "cx22"
  image       = "ubuntu-22.04"
  location    = "fsn1"
  ssh_keys    = [var.ssh_key]

  # Wait for SSH to be available
  provisioner "remote-exec" {
    inline = [
      "while ! nc -z localhost 22; do sleep 1; done"
    ]
    connection {
      type        = "ssh"
      user        = "root"
      host        = self.ipv4_address
      private_key = file("~/.ssh/id_rsa")
    }
  }
}

resource "null_resource" "deploy_backend" {
  depends_on = [hcloud_server.backend]

  # Always clean up /root/backend before copying
  provisioner "remote-exec" {
    inline = [
      "rm -rf /root/backend",
      "mkdir -p /root/backend",
      "ls -ld /root/backend" # Debug: show what /root/backend is now
    ]
    connection {
      type        = "ssh"
      user        = "root"
      host        = hcloud_server.backend.ipv4_address
      private_key = file(var.ssh_private_key_path)
    }
  }

  provisioner "file" {
    source      = "../backend/"
    destination = "/root/backend"
    connection {
      type        = "ssh"
      user        = "root"
      host        = hcloud_server.backend.ipv4_address
      private_key = file(var.ssh_private_key_path)
    }
  }

  provisioner "remote-exec" {
    inline = [
      # ── system prep ──────────────────────────────────────────────────────────
      "export DEBIAN_FRONTEND=noninteractive",
      "apt-get update -y",
      "apt-get install -y curl debian-keyring debian-archive-keyring apt-transport-https",

      # ── install Caddy from the release .deb (no apt repo, no GPG hassle) ────
      "echo 'Installing Caddy...'",
      "apt install -y debian-keyring debian-archive-keyring apt-transport-https curl",
      "curl -L -o /tmp/caddy.deb https://github.com/caddyserver/caddy/releases/download/v2.7.6/caddy_2.7.6_linux_amd64.deb",
      "dpkg -i /tmp/caddy.deb",
      "mkdir -p /etc/caddy",
      "printf '%s\n' '${var.domain} {' '  reverse_proxy localhost:5000' '}' > /etc/caddy/Caddyfile",
      "systemctl reload-or-restart caddy",

      # ── install Docker ─────────────────────────────────────────────────────────
      "apt-get update -y",
      "apt-get install -y ca-certificates curl gnupg lsb-release",
      "mkdir -p /etc/apt/keyrings",
      "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg",
      "echo \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable\" | tee /etc/apt/sources.list.d/docker.list > /dev/null",
      "apt-get update -y",
      "apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin",
      "systemctl enable docker",
      "systemctl start docker",

      # ── create Docker network ───────────────────────────────────────────────
      "docker network create appnet || true",

      # ── run Postgres container on appnet ───────────────────────────────────
      "docker rm -f postgres || true",
      "docker run -d --name postgres --network=appnet -e POSTGRES_USER=userxx -e POSTGRES_PASSWORD=yolodoneresser -e POSTGRES_DB=db -p 5432:5432 postgres:15",

      # ── build & (re)run backend container on appnet ────────────────────────
      "cd /root/backend && docker build -t backend .",
      "docker rm -f backend || true",
      "docker run -d --name backend --network=appnet -p 5000:5000 -e DATABASE_URL=postgresql://userxx:yolodoneresser@postgres:5432/db -e OPENAI_API_KEY=${var.OPENAI_API_KEY} backend"
    ]
    connection {
      type        = "ssh"
      user        = "root"
      host        = hcloud_server.backend.ipv4_address
      private_key = file(var.ssh_private_key_path)
    }
  }
}

output "backend_public_ip" {
  value = hcloud_server.backend.ipv4_address
  description = "The public IP address of the backend server. Use this for your frontend's NEXT_PUBLIC_API_URL."
}

variable "ssh_key" {
  description = "SSH key name registered in Hetzner Cloud"
  type        = string
} 
