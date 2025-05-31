# Makefile for Hetzner Terraform infra

.PHONY: init plan apply destroy redeploy-backend

# Load .env from project root and run terraform in infra/
init:
	cd infra && export $$(grep -v '^#' ../.env | xargs) && terraform init

plan:
	cd infra && export $$(grep -v '^#' ../.env | xargs) && terraform plan

apply:
	cd infra && export $$(grep -v '^#' ../.env | xargs) && terraform apply

destroy:
	cd infra && export $$(grep -v '^#' ../.env | xargs) && terraform destroy

redeploy-backend:
	cd infra && terraform taint null_resource.deploy_backend && cd .. && make apply 
