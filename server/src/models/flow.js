"use strict";

import e from "express";
import mongoose from "mongoose";

const FlowSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: Number,
            enum: [0, 1, 2],
            required: true,
            default: 1,
        },
        nodeData: {
            type: mongoose.Schema.Types.Mixed,
        },
        routeData: {
            type: mongoose.Schema.Types.Mixed,
        },
        callAnalytics: {
            success: {
                type: Number,
                default: 0,
            },
            decline: {
                type: Number,
                default: 0,
            },
            noAnswer: {
                type: Number,
                default: 0,
            },
            terminate: {
                type: Number,
                default: 0,
            },
        },
    },
    { timestamps: true }
);

const Flow = mongoose.model("Flow", FlowSchema);

export default Flow;
