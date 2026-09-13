import { NextResponse } from "next/server";
import { success } from "zod";

export function apiSuccess<T>(data: T, message = 'OK', status=200){
    return NextResponse.json({success:true, data, message}, {status});
}

export function apiError(message: string, status=400){
    return NextResponse.json({success:false, data: null, message}, {status});
}