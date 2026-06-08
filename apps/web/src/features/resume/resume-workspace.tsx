import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ResumeStrengthPanel } from "@/features/resume/resume-strength-panel";
import { calculateResumeStrength } from "@/features/resume/resume-strength";
import { useCurrentResume, useSaveResume, useUploadResume } from "@/features/resume/use-resume";
import type { EditableResumeProfile, ResumeWorkflow, StructuredResumeData } from "@/features/resume/types";

const emptyProfile: EditableResumeProfile = {
  headline: "",
  summary: "",
  skills: [],
  projects: [],
  experience: [],
  education: [],
};

function toLines(values: string[]): string {
  return values.join("\n");
}

function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toStructuredData(profile: EditableResumeProfile): StructuredResumeData {
  return {
    skills: profile.skills,
    projects: profile.projects,
    experience: profile.experience,
    education: profile.education,
  };
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function getStorageLabel(resume: ResumeWorkflow): string {
  return resume.resumeDocument.storage.provider === "cloudinary" ? "Cloudinary" : "Firebase Storage";
}

function ResumeLoadingState() {
  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <Skeleton className="h-72" />
      <Skeleton className="h-96" />
    </div>
  );
}

export function ResumeWorkspace() {
  const currentResumeQuery = useCurrentResume();
  const uploadResume = useUploadResume();
  const saveResume = useSaveResume();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeResume, setActiveResume] = useState<ResumeWorkflow | null>(null);
  const [profile, setProfile] = useState<EditableResumeProfile>(emptyProfile);
  const [localError, setLocalError] = useState<string | null>(null);

  const resume = activeResume;
  const isBusy = uploadResume.isPending || saveResume.isPending;

  useEffect(() => {
    if (currentResumeQuery.data) {
      setActiveResume(currentResumeQuery.data.resume);
    }
  }, [currentResumeQuery.data]);

  useEffect(() => {
    if (uploadResume.data) {
      setActiveResume(uploadResume.data);
    }
  }, [uploadResume.data]);

  useEffect(() => {
    if (saveResume.data) {
      setActiveResume(saveResume.data);
    }
  }, [saveResume.data]);

  useEffect(() => {
    if (activeResume) {
      setProfile(activeResume.parsedResume.editableProfile);
    }
  }, [activeResume]);

  const rawTextPreview = useMemo(() => {
    if (!resume?.parsedResume.rawText) {
      return "";
    }

    return resume.parsedResume.rawText.slice(0, 1400);
  }, [resume]);
  const resumeStrength = useMemo(() => calculateResumeStrength(profile), [profile]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setLocalError(null);
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!selectedFile) {
      setLocalError("Choose a PDF or DOCX resume first.");
      return;
    }

    const isAllowedType =
      selectedFile.type === "application/pdf" ||
      selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isAllowedType) {
      setLocalError("Resume must be a PDF or DOCX file.");
      return;
    }

    try {
      await uploadResume.mutateAsync(selectedFile);
    } catch {
      return;
    }
  }

  async function handleSave() {
    if (!resume) {
      return;
    }

    try {
      await saveResume.mutateAsync({
        resumeId: resume.parsedResume.id,
        editableProfile: profile,
        structuredData: toStructuredData(profile),
      });
    } catch {
      return;
    }
  }

  function updateTextField(field: "headline" | "summary", value: string) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateListField(field: "skills" | "projects" | "experience" | "education", value: string) {
    setProfile((current) => ({
      ...current,
      [field]: fromLines(value),
    }));
  }

  if (currentResumeQuery.isLoading) {
    return <ResumeLoadingState />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Resume Upload</CardTitle>
          <CardDescription>Upload a PDF or DOCX resume for parsing and review.</CardDescription>
        </CardHeader>
        <form aria-busy={isBusy} onSubmit={handleUpload}>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="resume">Resume file</FieldLabel>
                <Input
                  id="resume"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  aria-invalid={Boolean(localError || uploadResume.error)}
                  disabled={isBusy}
                  type="file"
                  onChange={handleFileChange}
                />
                <FieldDescription>Maximum file size is 8 MB.</FieldDescription>
              </Field>
              {selectedFile ? (
                <div className="rounded-md border bg-muted p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText />
                    <span className="truncate">{selectedFile.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              ) : null}
              {localError || uploadResume.error ? (
                <Field data-invalid="true">
                  <FieldError role="alert">{localError ?? getErrorMessage(uploadResume.error)}</FieldError>
                </Field>
              ) : null}
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled={isBusy} type="submit">
              {uploadResume.isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Upload data-icon="inline-start" />}
              Upload and parse
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="flex flex-col gap-4">
        {currentResumeQuery.error ? (
          <Card>
            <CardHeader>
              <CardTitle>Resume Review</CardTitle>
              <CardDescription>{getErrorMessage(currentResumeQuery.error)}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {!resume ? (
          <Card>
            <CardHeader>
              <CardTitle>Resume Review</CardTitle>
              <CardDescription>Upload a resume to review parsed sections and create an editable profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-64 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                No resume uploaded yet.
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Resume Metadata</CardTitle>
                <CardDescription>Original resume stored in {getStorageLabel(resume)}.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="font-medium">File</dt>
                    <dd className="mt-1 text-muted-foreground">{resume.resumeDocument.fileName}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Size</dt>
                    <dd className="mt-1 text-muted-foreground">{formatFileSize(resume.resumeDocument.sizeBytes)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Status</dt>
                    <dd className="mt-1 text-muted-foreground">{resume.resumeDocument.status}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Storage reference</dt>
                    <dd className="mt-1 truncate text-muted-foreground">{resume.resumeDocument.storage.reference}</dd>
                  </div>
                  {resume.resumeDocument.storage.secureUrl ? (
                    <div>
                      <dt className="font-medium">File URL</dt>
                      <dd className="mt-1 truncate text-muted-foreground">{resume.resumeDocument.storage.secureUrl}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="font-medium">Provider</dt>
                    <dd className="mt-1 text-muted-foreground">{getStorageLabel(resume)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume Strength Score</CardTitle>
                <CardDescription>Check resume completeness, evidence, and section coverage before you apply.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResumeStrengthPanel result={resumeStrength} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume Editing</CardTitle>
                <CardDescription>Review extracted sections and edit the profile before saving.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="headline">Headline</FieldLabel>
                    <Input
                      id="headline"
                      aria-invalid={Boolean(saveResume.error)}
                      disabled={isBusy}
                      value={profile.headline}
                      onChange={(event) => updateTextField("headline", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="summary">Summary</FieldLabel>
                    <Textarea
                      id="summary"
                      aria-invalid={Boolean(saveResume.error)}
                      disabled={isBusy}
                      value={profile.summary}
                      onChange={(event) => updateTextField("summary", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="skills">Skills</FieldLabel>
                    <Textarea
                      id="skills"
                      aria-invalid={Boolean(saveResume.error)}
                      disabled={isBusy}
                      value={toLines(profile.skills)}
                      onChange={(event) => updateListField("skills", event.target.value)}
                    />
                    <FieldDescription>One skill per line.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="projects">Projects</FieldLabel>
                    <Textarea
                      id="projects"
                      aria-invalid={Boolean(saveResume.error)}
                      disabled={isBusy}
                      value={toLines(profile.projects)}
                      onChange={(event) => updateListField("projects", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="experience">Experience</FieldLabel>
                    <Textarea
                      id="experience"
                      aria-invalid={Boolean(saveResume.error)}
                      disabled={isBusy}
                      value={toLines(profile.experience)}
                      onChange={(event) => updateListField("experience", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="education">Education</FieldLabel>
                    <Textarea
                      id="education"
                      aria-invalid={Boolean(saveResume.error)}
                      disabled={isBusy}
                      value={toLines(profile.education)}
                      onChange={(event) => updateListField("education", event.target.value)}
                    />
                  </Field>
                  {saveResume.error ? (
                    <Field data-invalid="true">
                      <FieldError role="alert">{getErrorMessage(saveResume.error)}</FieldError>
                    </Field>
                  ) : null}
                </FieldGroup>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {saveResume.isSuccess ? "Resume profile saved." : "Save updates after reviewing the parsed profile."}
                </p>
                <Button disabled={isBusy} onClick={handleSave}>
                  {saveResume.isPending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}
                  Save resume
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume Review</CardTitle>
                <CardDescription>Extracted text preview from the original resume.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm text-muted-foreground">
                  {rawTextPreview}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
