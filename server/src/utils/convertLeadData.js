import { StatusCodes } from "http-status-codes";
import ApiError from "./ApiError.js";

export const convertLeadData = async (fieldData = [], formId, accessToken) => {
    try {
        const url = `https://graph.facebook.com/v19.0/${formId}?fields=questions&access_token=${accessToken}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Error fetching form data: ${data}`
            );
        }

        const questions = data?.questions || [];

        const questionMap = questions.reduce((acc, question) => {
            const fieldName =
                question.type && question.type !== "CUSTOM"
                    ? question.type.toLowerCase().trim()
                    : question.key;
            acc[question.key] = { fieldName, type: question.type };
            return acc;
        }, {});

        const result = {};

        for (const field of fieldData) {
            if (field.name && Array.isArray(field.values) && field.values.length > 0) {
                const mappedFieldName = questionMap[field.name] || field.name; // fallback if not found
                if (mappedFieldName.type === "CUSTOM") {
                    // let innerObj = {};
                    result[mappedFieldName.fieldName] = field.values[0];
                    // result["custom_fields"] = innerObj;
                } else result[mappedFieldName.fieldName.trim()] = field.values[0];
            }
        }

        return result;
    } catch (error) {
        throw error;
    }
};

export default convertLeadData;
