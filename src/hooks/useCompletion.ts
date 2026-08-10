import { useMemo } from 'react';
import type { ResumeData, StepKey } from '@/types';

export function useCompletion(data: ResumeData): Record<StepKey, number> {
  return useMemo(() => {
    const personal =
      ([
        data.fullName,
        data.title,
        data.email,
        data.phone,
        data.location,
        data.summary,
      ].filter(Boolean).length /
        6) *
      100;

    const education =
      data.education.length === 0
        ? 0
        : Math.min(
            100,
            (data.education.filter(
              (e) => e.school && e.degree && e.startDate
            ).length /
              data.education.length) *
              100
          );

    const experience =
      data.experience.length === 0
        ? 0
        : Math.min(
            100,
            (data.experience.filter(
              (e) => e.company && e.position && e.startDate
            ).length /
              data.experience.length) *
              100
          );

    const skills =
      data.skills.length === 0 ? 0 : Math.min(100, (data.skills.filter((s) => s.name).length / data.skills.length) * 100);

    const projects =
      data.projects.length === 0
        ? 0
        : Math.min(
            100,
            (data.projects.filter((p) => p.name && p.description).length /
              data.projects.length) *
              100
          );

    return { personal, education, experience, skills, projects, template: 100 };
  }, [data]);
}
