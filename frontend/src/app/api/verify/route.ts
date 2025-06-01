import {
  ISuccessResult,
  IVerifyResponse,
  verifyCloudProof,
} from "@worldcoin/minikit-js";
import { NextRequest, NextResponse } from "next/server";

interface IRequestPayload {
  payload: ISuccessResult;
  action: string;
  signal: string | undefined;
}

export async function POST(req: NextRequest) {
  const { payload, action, signal } = (await req.json()) as IRequestPayload;
  const app_id = process.env.APP_ID as `app_${string}`;
  if (!app_id) {
    return NextResponse.json(
      { error: "APP_ID not set in environment." },
      { status: 500 }
    );
  }
  const verifyRes = (await verifyCloudProof(
    payload,
    app_id,
    action,
    signal
  )) as IVerifyResponse;

  if (verifyRes.success) {
    // You can add logic here to mark the user as verified in your DB if needed
    return NextResponse.json({ verifyRes, status: 200 });
  } else {
    return NextResponse.json({ verifyRes, status: 400 });
  }
}
