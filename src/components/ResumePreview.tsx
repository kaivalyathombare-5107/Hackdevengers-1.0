import { forwardRef } from 'react';
import type { ResumeData } from '@/types';
import ModernTemplate from '@/resume/MordenTemplate';
import ClassicTemplate from '@/resume/ClassicTemplate';
import MinimalTemplate from '@/resume/MinimalTemplate';

type Props = { data: ResumeData };

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  return (
    {/* ADDED id="resume-preview" HERE */}
    <div ref={ref} id="resume-preview" className="h-full w-full bg-white">
      {data.template === 'modern' && <ModernTemplate data={data} />}
      {data.template === 'classic' && <ClassicTemplate data={data} />}
      {data.template === 'minimal' && <MinimalTemplate data={data} />}
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
export default ResumePreview;
