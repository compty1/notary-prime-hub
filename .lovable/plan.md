

# Lovable Notary Training Academy — Full Implementation Plan

## Summary

Transform the existing flat `e_courses` / `e_course_enrollments` system into a full Learning Management System (LMS) based on the 6 uploaded specification documents. This covers 10 courses (including 5 specialty tracks), 61 modules, 199 lessons, 71 assessments, prerequisite gating, quiz engine, certificate generation, and learner/admin UIs.

---

## Phase 1: Database Schema (Migration)

Create 4 new tables to support the hierarchical course structure:

- **`academy_modules`** — `id, course_id (FK e_courses), title, description, sort_order, duration_minutes, is_published`
- **`academy_lessons`** — `id, module_id (FK academy_modules), title, content_html, content_type (text/video/interactive), sort_order, duration_minutes, is_published`
- **`academy_quizzes`** — `id, module_id (FK, nullable), course_id (FK), title, quiz_type (module/final), passing_score, questions (jsonb), sort_order`
- **`academy_quiz_attempts`** — `id, user_id, quiz_id (FK), score, passed, answers (jsonb), created_at`
- **`academy_lesson_progress`** — `id, user_id, lesson_id (FK), completed_at` (unique on user+lesson)
- **`academy_certificates`** — `id, user_id, course_id (FK), certificate_number, issued_at, certificate_data (jsonb)`

Add columns to `e_courses`: `prerequisite_course_ids (uuid[])`, `course_code (text)`, `tier (int)`, `total_hours (numeric)`, `certificate_title (text)`

RLS policies: authenticated users can read published content; users can only write their own progress/attempts.

---

## Phase 2: Seed All Course Data

Insert all 10 courses, 61 modules, 199 lessons, and 71 quiz definitions using the data tool:

| Course | Code | Modules | Lessons | Hours |
|--------|------|---------|---------|-------|
| Pre-Commission | C1 | 6 | 18 | 6 |
| Foundations | C2 | 8 | 27 | 8 |
| Advanced Practice | C3 | 8 | 28 | 10 |
| NSA Specialty | C4A | 10 | 35 | 12 |
| RON Specialty | C4B | 6 | 18 | 6 |
| Apostille Specialty | C4C | 4 | 12 | 4 |
| Real Estate Specialty | C4D | 5 | 16 | 6 |
| I-9 Specialty | C4E | 3 | 9 | 3 |
| Business Mastery | C5 | 8 | 28 | 10 |
| Renewal Express | C6 | 3 | 8 | 1.5 |

Each quiz seeded with 5-10 multiple-choice questions per the PDF specifications.

---

## Phase 3: Learner-Facing Pages

### Academy Landing Page (`/academy`)
- Hero section with mission statement
- Course catalog grid with tier badges, duration, price
- Progress dashboard for enrolled users (overall % across all courses)
- Prerequisite lock indicators on gated courses

### Course Detail Page (`/academy/course/:slug`)
- Course overview, objectives, instructor, duration
- Module accordion with lesson list and completion checkmarks
- Prerequisite check — locked UI with explanation if not met
- "Enroll" / "Continue" button
- Progress bar

### Lesson Viewer (`/academy/lesson/:id`)
- Rich content renderer (HTML content with styled typography)
- Previous/Next navigation
- Auto-mark complete on scroll-to-bottom or explicit button
- Sidebar showing module outline with progress dots

### Quiz Page (`/academy/quiz/:id`)
- Multiple-choice question renderer from JSONB
- Timer display (optional)
- Score calculation and pass/fail result
- Retry logic (module quizzes: unlimited; final exams: 3 attempts, 48hr lockout on fail)
- Prerequisite: all module lessons must be complete before module quiz unlocks

### Certificate Page (`/academy/certificate/:id`)
- Printable certificate with course name, learner name, date, certificate number
- Download as PDF option
- Auto-generated on final exam pass (80%+ score)

---

## Phase 4: Prerequisite Gating Logic

Implement a `usePrerequisiteCheck(courseCode)` hook:
- C1, C6: no gate (open)
- C2: requires C1 certificate OR active Ohio commission
- C3: requires C2 certificate
- C4A-4E: requires C2 certificate
- C5: requires C3 certificate + at least one C4x certificate

Within each course: lessons unlock sequentially; module quiz requires all module lessons complete; final exam requires all module quizzes passed.

---

## Phase 5: Admin Enhancements

### Expand AdminECourses.tsx
- Add "Modules" tab — CRUD for modules per course (title, sort order, duration)
- Add "Lessons" tab — CRUD for lessons per module (title, content HTML editor, sort order)
- Add "Quizzes" tab — quiz builder with question/answer/correct-answer JSON editor
- Add "Certificates" tab — view issued certificates, revoke capability
- Add course prerequisite selector (multi-select of other courses)

### Admin Analytics
- Per-course completion rates, average quiz scores, dropout points
- Learner leaderboard

---

## Phase 6: Integration with Existing Site

- Update `AdminDashboard.tsx` sidebar: rename "E-Courses" to "Training Academy"
- Add `/academy` route to `App.tsx` (public-facing)
- Add portal link at `/portal/ecourses` redirecting to `/academy` with auth context
- Update `AdminNotaryTraining.tsx` to pull from academy tables instead of `continuing_education`

---

## Technical Details

- **Files created (~15)**: `AcademyLanding.tsx`, `AcademyCourseDetail.tsx`, `AcademyLessonViewer.tsx`, `AcademyQuiz.tsx`, `AcademyCertificate.tsx`, `usePrerequisiteCheck.ts`, `useAcademyProgress.ts`, `useLessonProgress.ts`, `academyCourseData.ts` (seed constants), `AdminModuleBuilder.tsx`, `AdminLessonEditor.tsx`, `AdminQuizBuilder.tsx`, `AdminCertificates.tsx`
- **Files modified (~4)**: `App.tsx` (routes), `AdminDashboard.tsx` (sidebar), `AdminECourses.tsx` (tabs expansion), `AdminNotaryTraining.tsx` (link to academy)
- **Migrations**: 1 migration for new tables + columns; data seeding via insert tool
- **No external dependencies needed** — uses existing UI components, Supabase client, React Query

