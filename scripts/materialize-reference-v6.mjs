import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const sourceDir = resolve(root, 'assets/reference-v6');
const outputDir = resolve(root, 'public/illustrations/reference-v6');

await mkdir(outputDir, { recursive: true });

async function readBase64(file) {
  return (await readFile(resolve(sourceDir, file), 'utf8')).replace(/\s+/g, '');
}

async function materialize(output, sourceFiles) {
  const encoded = (await Promise.all(sourceFiles.map(readBase64))).join('');
  const buffer = Buffer.from(encoded, 'base64');
  await writeFile(resolve(outputDir, output), buffer);
  console.log(`reference-v6: ${output} (${buffer.length} bytes)`);
}

await Promise.all([
  materialize('hero_classroom_main.avif', [
    'hero_classroom_main.part1.b64',
    'hero_classroom_main.part2.b64',
    'hero_classroom_main.part3.b64',
  ]),
  materialize('today_schedule_calendar_clock.avif', ['today_schedule_calendar_clock.b64']),
  materialize('lesson_preparation_papers_pen.avif', ['lesson_preparation_papers_pen.b64']),
  materialize('academic_progress_chart.avif', ['academic_progress_chart.b64']),
  materialize('sidebar_mountain_scene.avif', ['sidebar_mountain_scene.b64']),
]);
