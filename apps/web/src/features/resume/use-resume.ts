import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { createResumeApi } from "@/features/resume/resume-api";
import type { EditableResumeProfile, StructuredResumeData } from "@/features/resume/types";

const resumeQueryKey = ["resume", "current"];

export function useCurrentResume() {
  const { user } = useAuth();
  const resumeApi = createResumeApi(user);

  return useQuery({
    enabled: Boolean(user),
    queryKey: resumeQueryKey,
    queryFn: () => resumeApi.getCurrentResume(),
  });
}

export function useUploadResume() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const resumeApi = createResumeApi(user);

  return useMutation({
    mutationFn: (file: File) => resumeApi.uploadResume(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resumeQueryKey });
    },
  });
}

export function useSaveResume() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const resumeApi = createResumeApi(user);

  return useMutation({
    mutationFn: (params: {
      resumeId: string;
      structuredData: StructuredResumeData;
      editableProfile: EditableResumeProfile;
    }) =>
      resumeApi.saveResume(params.resumeId, {
        structuredData: params.structuredData,
        editableProfile: params.editableProfile,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: resumeQueryKey });
    },
  });
}

