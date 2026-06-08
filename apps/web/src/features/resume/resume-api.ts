import { createApiClient } from "@/services/api-client";
import type { User } from "firebase/auth";
import type { CurrentResumeResponse, EditableResumeProfile, ResumeWorkflow, StructuredResumeData } from "./types";

export function createResumeApi(user: User | null) {
  const client = createApiClient({ user });

  return {
    getCurrentResume: () => client.get<CurrentResumeResponse>("/resumes/current"),
    uploadResume: (file: File) => {
      const formData = new FormData();
      formData.append("resume", file);
      return client.postForm<ResumeWorkflow>("/resumes/upload", formData);
    },
    saveResume: (
      resumeId: string,
      payload: {
        structuredData: StructuredResumeData;
        editableProfile: EditableResumeProfile;
      },
    ) => client.patch<ResumeWorkflow>(`/resumes/${resumeId}`, payload),
  };
}

