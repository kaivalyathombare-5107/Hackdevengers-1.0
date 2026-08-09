import { forwardRef } from 'react';
import type { ResumeData, ResumeTemplate } from '@/types';
import ModernTemplate from '@/components/resume/ModernTemplate';
import ClassicTemplate from '@/components/resume/ClassicTemplate';
import MinimalTemplate from '@/components/resume/MinimalTemplate';

type Props = { data: ResumeData; template: ResumeTemplate };

const TEMPLATE_MAP = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
} as const;

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data, template }, ref) => {
  const Template = TEMPLATE_MAP[template];
  return (
    <div ref={ref} className="h-full w-full">
      <Template data={data} />
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
export default ResumePreview;
