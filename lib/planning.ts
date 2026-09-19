import type { SupabaseClient } from '@supabase/supabase-js';
import { getCurriculumContext } from '@/lib/v1';

export type LessonProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'partial'
  | 'postponed'
  | 'skipped';

export type PlanningLesson = {
  id: string;
  title: string;
  lessonNumber: number;
  orderIndex: number;
  durationMinutes: number;
  domainName: string | null;
  status: LessonProgressStatus;
  completionPercent: number;
  teacherNotes: string | null;
};

export type PlanningWeek = {
  id: string;
  number: number;
  title: string | null;
  orderIndex: number;
  lessons: PlanningLesson[];
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
};

export type PlanningUnit = {
  id: string;
  number: number;
  title: string;
  description: string | null;
  orderIndex: number;
  weeks: PlanningWeek[];
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
};

export type PlanningData = {
  curriculum: {
    id: string;
    gradeCode: string;
    gradeName: string;
    subjectName: string;
    academicYear: string;
  };
  units: PlanningUnit[];
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  currentLesson: (PlanningLesson & {
    unitId: string;
    unitTitle: string;
    weekId: string;
    weekNumber: number;
  }) | null;
};

function normalizeStatus(value: string | null | undefined): LessonProgressStatus {
  if (
    value === 'in_progress' ||
    value === 'completed' ||
    value === 'partial' ||
    value === 'postponed' ||
    value === 'skipped'
  ) {
    return value;
  }

  return 'not_started';
}

export async function getPlanningData(
  supabase: SupabaseClient,
  teacherContextId: string,
  curriculumId: string,
): Promise<PlanningData | null> {
  const curriculumContext = await getCurriculumContext(supabase, curriculumId);
  if (!curriculumContext) return null;

  const { data: units } = await supabase
    .from('units')
    .select('id, number, title, description, order_index')
    .eq('curriculum_id', curriculumId)
    .eq('status', 'published')
    .order('order_index');

  const unitRows = units ?? [];
  const unitIds = unitRows.map((unit) => unit.id);

  const { data: weeks } = unitIds.length
    ? await supabase
        .from('weeks')
        .select('id, unit_id, number, title, order_index')
        .in('unit_id', unitIds)
        .eq('status', 'published')
        .order('order_index')
    : { data: [] as Array<{ id: string; unit_id: string; number: number; title: string | null; order_index: number }> };

  const weekRows = weeks ?? [];
  const weekIds = weekRows.map((week) => week.id);

  const { data: lessons } = weekIds.length
    ? await supabase
        .from('lessons')
        .select('id, week_id, domain_id, title, lesson_number, order_index, duration_minutes')
        .in('week_id', weekIds)
        .eq('status', 'published')
        .order('order_index')
    : {
        data: [] as Array<{
          id: string;
          week_id: string;
          domain_id: string | null;
          title: string;
          lesson_number: number;
          order_index: number;
          duration_minutes: number;
        }>,
      };

  const lessonRows = lessons ?? [];
  const lessonIds = lessonRows.map((lesson) => lesson.id);

  const [{ data: progressRows }, { data: domains }] = await Promise.all([
    lessonIds.length
      ? supabase
          .from('teacher_lesson_progress')
          .select('lesson_id, status, completion_percent, teacher_notes')
          .eq('teacher_context_id', teacherContextId)
          .in('lesson_id', lessonIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('domains')
      .select('id, name_ar')
      .eq('subject_id', curriculumContext.subject.id)
      .eq('is_active', true),
  ]);

  const progressByLesson = new Map(
    (progressRows ?? []).map((row) => [
      row.lesson_id,
      {
        status: normalizeStatus(row.status),
        completionPercent: row.completion_percent ?? 0,
        teacherNotes: row.teacher_notes ?? null,
      },
    ]),
  );
  const domainById = new Map((domains ?? []).map((domain) => [domain.id, domain.name_ar]));
  const lessonsByWeek = new Map<string, PlanningLesson[]>();

  for (const lesson of lessonRows) {
    const saved = progressByLesson.get(lesson.id);
    const item: PlanningLesson = {
      id: lesson.id,
      title: lesson.title,
      lessonNumber: lesson.lesson_number,
      orderIndex: lesson.order_index,
      durationMinutes: lesson.duration_minutes,
      domainName: lesson.domain_id ? domainById.get(lesson.domain_id) ?? null : null,
      status: saved?.status ?? 'not_started',
      completionPercent: saved?.completionPercent ?? 0,
      teacherNotes: saved?.teacherNotes ?? null,
    };

    const current = lessonsByWeek.get(lesson.week_id) ?? [];
    current.push(item);
    lessonsByWeek.set(lesson.week_id, current);
  }

  for (const lessonList of lessonsByWeek.values()) {
    lessonList.sort((a, b) => a.orderIndex - b.orderIndex || a.lessonNumber - b.lessonNumber);
  }

  const weeksByUnit = new Map<string, PlanningWeek[]>();
  for (const week of weekRows) {
    const weekLessons = lessonsByWeek.get(week.id) ?? [];
    const completedLessons = weekLessons.filter((lesson) => lesson.status === 'completed').length;
    const totalLessons = weekLessons.length;
    const item: PlanningWeek = {
      id: week.id,
      number: week.number,
      title: week.title,
      orderIndex: week.order_index,
      lessons: weekLessons,
      completedLessons,
      totalLessons,
      progressPercent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };

    const current = weeksByUnit.get(week.unit_id) ?? [];
    current.push(item);
    weeksByUnit.set(week.unit_id, current);
  }

  for (const weekList of weeksByUnit.values()) {
    weekList.sort((a, b) => a.orderIndex - b.orderIndex || a.number - b.number);
  }

  const planningUnits: PlanningUnit[] = unitRows.map((unit) => {
    const unitWeeks = weeksByUnit.get(unit.id) ?? [];
    const unitLessons = unitWeeks.flatMap((week) => week.lessons);
    const completedLessons = unitLessons.filter((lesson) => lesson.status === 'completed').length;
    const totalLessons = unitLessons.length;

    return {
      id: unit.id,
      number: unit.number,
      title: unit.title,
      description: unit.description,
      orderIndex: unit.order_index,
      weeks: unitWeeks,
      completedLessons,
      totalLessons,
      progressPercent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
    };
  });

  const allLessons = planningUnits.flatMap((unit) =>
    unit.weeks.flatMap((week) =>
      week.lessons.map((lesson) => ({
        ...lesson,
        unitId: unit.id,
        unitTitle: unit.title,
        weekId: week.id,
        weekNumber: week.number,
      })),
    ),
  );

  const completedLessons = allLessons.filter((lesson) => lesson.status === 'completed').length;
  const totalLessons = allLessons.length;
  const currentLesson =
    allLessons.find((lesson) => lesson.status !== 'completed' && lesson.status !== 'skipped') ?? null;

  return {
    curriculum: {
      id: curriculumContext.curriculum.id,
      gradeCode: curriculumContext.grade.code,
      gradeName: curriculumContext.grade.name_ar,
      subjectName: curriculumContext.subject.name_ar,
      academicYear: curriculumContext.year.name,
    },
    units: planningUnits,
    totalLessons,
    completedLessons,
    progressPercent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
    currentLesson,
  };
}
