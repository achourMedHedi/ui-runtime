import { ApiAction, WorkflowNodeUIProps, WorkflowReturn } from "./types";
import { FC } from "react";

const execApiAction = async (action: ApiAction): Promise<WorkflowReturn<{body: any, status: number}>> => {
    if (action.config.mockData) {
        return { data: action.config.mockData };
    }

    const { url, method, headers, body } = action.config;
    const requestOptions: any = {
        method: method,
        headers: headers || {},
    };

    if (body) {
        requestOptions.body = JSON.stringify(body);
        requestOptions.headers['Content-Type'] = 'application/json';
    }
    requestOptions.headers["authorization"] = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtb2hhbWVkLmFjaG91ciIsImlhdCI6MTc1MzM1ODIwNSwiZXhwIjoxNzUzOTYzMDA1LCJqdGkiOiJ1UjdyeEhsQlVDTTF6cVZZMEktcWd3IiwicCI6WzEwMSwxMDIsMTAzLDEwNCwxMDUsMTA2LDEwOCwxMTAsMTEyLDExMywxMTQsMTE1LDExNywxMThdfQ.9vUpwmDG9B0OIhp3pPhxOBlkraT_Rj9PR1nTh5uB4BE"

    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            return { error: `HTTP error! status: ${response.status}`, data: { body: null, status: response.status } }
        }
        const body = await response.json();
        return { data: { body, status: response.status } }
    } catch (error) {
        return { error: "error", data: { body: null, status: 500 } };
    }

}

export const UIEditApiAction: FC<WorkflowNodeUIProps> = ({ values, onChange }) => {
    return <div>
        <input type="text" placeholder="URL" value={values.url} onChange={(e) => onChange("url", e.target.value)} />
        <select  value={values.method} onChange={(e) => onChange("method", e.target.value)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
        </select>
    </div>
}

export default execApiAction;