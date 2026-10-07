import { PrismaClient, Role, ActivityCategory, ActivityStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper: add days to today
function daysFromToday(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 0, 0, 0);
  return d;
}
function daysAgo(n: number): Date {
  return daysFromToday(-n);
}

async function main() {
  console.log('🌱  Seeding FacultyFlow demo data...');

  // --------------------------------------------------
  // 1. Departments
  // --------------------------------------------------
  const ceDept = await prisma.department.upsert({
    where: { code: 'CE' },
    update: {},
    create: { name: 'Computer Engineering', code: 'CE' },
  });

  const itDept = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: { name: 'Information Technology', code: 'IT' },
  });

  await prisma.department.upsert({
    where: { code: 'MECH' },
    update: {},
    create: { name: 'Mechanical Engineering', code: 'MECH' },
  });

  console.log('  ✅ Departments created');

  // --------------------------------------------------
  // 2. Users: ADMIN, HOD, Faculties
  // --------------------------------------------------
  const hash = await bcrypt.hash('FacultyFlow@123', 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin.demo@facultyflow.local' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin.demo@facultyflow.local',
      passwordHash: hash,
      role: Role.ADMIN,
      facultyProfile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          designation: 'System Administrator',
          departmentId: ceDept.id,
        },
      },
    },
    include: { facultyProfile: true },
  });

  // HOD (Computer Engineering)
  const hodUser = await prisma.user.upsert({
    where: { email: 'hod.demo@facultyflow.local' },
    update: {},
    create: {
      name: 'Dr. Darshan Kulkarni',
      email: 'hod.demo@facultyflow.local',
      passwordHash: hash,
      role: Role.HOD,
      facultyProfile: {
        create: {
          firstName: 'Dr. Darshan',
          lastName: 'Kulkarni',
          designation: 'Head of Department',
          departmentId: ceDept.id,
          employeeId: 'CE-HOD-001',
          phone: '+91-98765-43210',
          officeLocation: 'CE Block, Room 301',
          bio: 'Ph.D. in Computer Science. 15 years of teaching and research experience.',
        },
      },
    },
    include: { facultyProfile: true },
  });

  // Update HOD of Department
  if (hodUser.facultyProfile) {
    await prisma.department.update({
      where: { id: ceDept.id },
      data: { hodId: hodUser.facultyProfile.id },
    });
  }

  // Faculty 1 — Primary Demo (Prof. Rahul Mehta)
  const faculty1 = await prisma.user.upsert({
    where: { email: 'faculty.demo@facultyflow.local' },
    update: {},
    create: {
      name: 'Prof. Rahul Mehta',
      email: 'faculty.demo@facultyflow.local',
      passwordHash: hash,
      role: Role.FACULTY,
      facultyProfile: {
        create: {
          firstName: 'Prof. Rahul',
          lastName: 'Mehta',
          designation: 'Assistant Professor',
          departmentId: ceDept.id,
          employeeId: 'CE-FAC-001',
          phone: '+91-98765-12340',
          officeLocation: 'CE Block, Room 102',
          bio: 'Specializes in Databases and Web Technologies. 8 years experience.',
        },
      },
    },
    include: { facultyProfile: true },
  });

  // Additional Faculty members for HOD Dashboard
  const facultyNames = [
    { name: 'Dr. Anjali Sharma', email: 'faculty2.demo@facultyflow.local', empId: 'CE-FAC-D02', desig: 'Associate Professor' },
    { name: 'Dr. Suresh Patil', email: 'faculty3.demo@facultyflow.local', empId: 'IT-FAC-D01', desig: 'Assistant Professor' },
    { name: 'Dr. Rekha Desai', email: 'faculty4.demo@facultyflow.local', empId: 'CE-FAC-D03', desig: 'Assistant Professor' },
    { name: 'Dr. Prakash Joshi', email: 'faculty5.demo@facultyflow.local', empId: 'CE-FAC-D04', desig: 'Associate Professor' },
    { name: 'Dr. Kavita Kulkarni', email: 'faculty6.demo@facultyflow.local', empId: 'CE-FAC-D05', desig: 'Assistant Professor' },
    { name: 'Dr. Mohan Gupta', email: 'faculty7.demo@facultyflow.local', empId: 'CE-FAC-D06', desig: 'Professor' },
    { name: 'Dr. Neha Verma', email: 'faculty8.demo@facultyflow.local', empId: 'CE-FAC-D07', desig: 'Assistant Professor' },
    { name: 'Dr. Tejinder Singh', email: 'faculty9.demo@facultyflow.local', empId: 'CE-FAC-D08', desig: 'Associate Professor' },
    { name: 'Dr. Lata Yadav', email: 'faculty10.demo@facultyflow.local', empId: 'CE-FAC-D09', desig: 'Assistant Professor' },
  ];

  const extraFaculties = [];
  for (const fn of facultyNames) {
    // Check if profile with this empId already exists and clear it first
    await prisma.facultyProfile.updateMany({
      where: { employeeId: fn.empId },
      data: { employeeId: null },
    });
    const fac = await prisma.user.upsert({
      where: { email: fn.email },
      update: {},
      create: {
        name: fn.name,
        email: fn.email,
        passwordHash: hash,
        role: Role.FACULTY,
        facultyProfile: {
          create: {
            firstName: fn.name.split(' ')[0] + ' ' + fn.name.split(' ')[1],
            lastName: fn.name.split(' ').slice(2).join(' '),
            designation: fn.desig,
            departmentId: ceDept.id,
            employeeId: fn.empId,
          },
        },
      },
      include: { facultyProfile: true },
    });
    extraFaculties.push(fac);
  }

  console.log('  ✅ Users created');

  // --------------------------------------------------
  // 3. Activities
  // --------------------------------------------------

  // Delete old demo activities for fresh start
  const allProfileIds = [
    admin.facultyProfile?.id,
    hodUser.facultyProfile?.id,
    faculty1.facultyProfile?.id,
    ...extraFaculties.map(f => f.facultyProfile?.id),
  ].filter(Boolean) as string[];

  await prisma.activity.deleteMany({
    where: { facultyProfileId: { in: allProfileIds } },
  });

  const f1ProfileId = faculty1.facultyProfile!.id;

  // -------------------------------------------------------
  // Faculty 1 (Prof. Rahul Mehta) — Specific rich activities
  // -------------------------------------------------------
  const faculty1Activities = [
    // === COMPLETED Historical (Sept 2026) ===
    { title: 'DBMS Lecture - Unit 1', category: ActivityCategory.TEACHING, date: daysAgo(28), estimatedMinutes: 60, actualMinutes: 65, status: ActivityStatus.COMPLETED },
    { title: 'DBMS Lecture - Unit 2', category: ActivityCategory.TEACHING, date: daysAgo(26), estimatedMinutes: 60, actualMinutes: 70, status: ActivityStatus.COMPLETED },
    { title: 'Data Structures Lecture', category: ActivityCategory.TEACHING, date: daysAgo(25), estimatedMinutes: 60, actualMinutes: 55, status: ActivityStatus.COMPLETED },
    { title: 'DBMS Lecture Preparation', category: ActivityCategory.PREPARATION, date: daysAgo(24), estimatedMinutes: 90, actualMinutes: 100, status: ActivityStatus.COMPLETED },
    { title: 'Lab Assignment Evaluation', category: ActivityCategory.EVALUATION, date: daysAgo(23), estimatedMinutes: 180, actualMinutes: 210, status: ActivityStatus.COMPLETED },
    { title: 'Operating Systems Lecture', category: ActivityCategory.TEACHING, date: daysAgo(22), estimatedMinutes: 60, actualMinutes: 60, status: ActivityStatus.COMPLETED },
    { title: 'Research Paper Reading', category: ActivityCategory.RESEARCH, date: daysAgo(21), estimatedMinutes: 120, actualMinutes: 135, status: ActivityStatus.COMPLETED },
    { title: 'Department Meeting', category: ActivityCategory.MEETING, date: daysAgo(20), estimatedMinutes: 90, actualMinutes: 80, status: ActivityStatus.COMPLETED },
    { title: 'Unit 1 Lab Session', category: ActivityCategory.LABORATORY, date: daysAgo(19), estimatedMinutes: 120, actualMinutes: 125, status: ActivityStatus.COMPLETED },
    { title: 'Assignment Evaluation', category: ActivityCategory.EVALUATION, date: daysAgo(18), estimatedMinutes: 150, actualMinutes: 160, status: ActivityStatus.COMPLETED },
    { title: 'Computer Networks Lecture', category: ActivityCategory.TEACHING, date: daysAgo(17), estimatedMinutes: 60, actualMinutes: 65, status: ActivityStatus.COMPLETED },
    { title: 'Unit 2 Lecture Notes', category: ActivityCategory.PREPARATION, date: daysAgo(16), estimatedMinutes: 120, actualMinutes: 130, status: ActivityStatus.COMPLETED },
    { title: 'Student Mentoring Session', category: ActivityCategory.MENTORING, date: daysAgo(15), estimatedMinutes: 60, actualMinutes: 75, status: ActivityStatus.COMPLETED },
    { title: 'Software Engineering Lecture', category: ActivityCategory.TEACHING, date: daysAgo(14), estimatedMinutes: 60, actualMinutes: 60, status: ActivityStatus.COMPLETED },
    { title: 'Literature Review - ML Paper', category: ActivityCategory.RESEARCH, date: daysAgo(13), estimatedMinutes: 150, actualMinutes: 160, status: ActivityStatus.COMPLETED },
    { title: 'Attendance Review & Documentation', category: ActivityCategory.ADMINISTRATION, date: daysAgo(12), estimatedMinutes: 60, actualMinutes: 55, status: ActivityStatus.COMPLETED },
    { title: 'DBMS Lecture - Unit 3', category: ActivityCategory.TEACHING, date: daysAgo(11), estimatedMinutes: 60, actualMinutes: 70, status: ActivityStatus.COMPLETED },
    { title: 'Lab Manual Preparation', category: ActivityCategory.PREPARATION, date: daysAgo(10), estimatedMinutes: 180, actualMinutes: 195, status: ActivityStatus.COMPLETED },
    { title: 'Internal Assessment Review', category: ActivityCategory.EVALUATION, date: daysAgo(9), estimatedMinutes: 120, actualMinutes: 130, status: ActivityStatus.COMPLETED },
    { title: 'Project Guidance - Group A', category: ActivityCategory.PROJECT_SUPERVISION, date: daysAgo(8), estimatedMinutes: 90, actualMinutes: 100, status: ActivityStatus.COMPLETED },
    { title: 'Faculty Coordination Meeting', category: ActivityCategory.MEETING, date: daysAgo(7), estimatedMinutes: 60, actualMinutes: 55, status: ActivityStatus.COMPLETED },
    // === IN_PROGRESS (Current Week) ===
    { title: 'Midterm Paper Evaluation', category: ActivityCategory.EVALUATION, date: daysAgo(4), estimatedMinutes: 240, actualMinutes: 120, status: ActivityStatus.IN_PROGRESS, deadline: daysAgo(1) }, // Overdue -> CRITICAL
    { title: 'Research Paper Draft - IEEE Access', category: ActivityCategory.RESEARCH, date: daysAgo(3), estimatedMinutes: 300, actualMinutes: 150, status: ActivityStatus.IN_PROGRESS, deadline: daysFromToday(1) }, // Due tomorrow -> HIGH
    { title: 'Data Structures Lab Session', category: ActivityCategory.LABORATORY, date: daysAgo(2), estimatedMinutes: 120, actualMinutes: null, status: ActivityStatus.IN_PROGRESS, deadline: daysFromToday(2) }, // Due in 2 days -> HIGH
    // === PLANNED Future (HIGH priority — deadline soon) ===
    { title: 'Unit 4 Lecture Notes Preparation', category: ActivityCategory.PREPARATION, date: daysFromToday(1), estimatedMinutes: 240, actualMinutes: null, status: ActivityStatus.PLANNED, deadline: daysFromToday(1) }, // Due tomorrow + 240 mins -> HIGH
    { title: 'Lab Assignment Evaluation - Batch B', category: ActivityCategory.EVALUATION, date: daysFromToday(2), estimatedMinutes: 210, actualMinutes: null, status: ActivityStatus.PLANNED, deadline: daysFromToday(3) }, // Due in 3 days -> MEDIUM/HIGH
    { title: 'DBMS Lecture - Unit 4', category: ActivityCategory.TEACHING, date: daysFromToday(3), estimatedMinutes: 60, actualMinutes: null, status: ActivityStatus.PLANNED, deadline: daysFromToday(3) },
    // === PLANNED Future (MEDIUM priority) ===
    { title: 'Project Review Meeting', category: ActivityCategory.MEETING, date: daysFromToday(5), estimatedMinutes: 90, actualMinutes: null, status: ActivityStatus.PLANNED, deadline: daysFromToday(6) },
    { title: 'Question Paper Preparation - Midterm 2', category: ActivityCategory.PREPARATION, date: daysFromToday(6), estimatedMinutes: 180, actualMinutes: null, status: ActivityStatus.PLANNED, deadline: daysFromToday(7) },
    { title: 'Student Project Review - Final Year', category: ActivityCategory.PROJECT_SUPERVISION, date: daysFromToday(7), estimatedMinutes: 120, actualMinutes: null, status: ActivityStatus.PLANNED, deadline: daysFromToday(10) },
    { title: 'Computer Networks Lab Demonstration', category: ActivityCategory.LABORATORY, date: daysFromToday(8), estimatedMinutes: 120, actualMinutes: null, status: ActivityStatus.PLANNED, deadline: daysFromToday(12) },
    // === PLANNED Future (LOW priority) ===
    { title: 'Course File Preparation & Audit', category: ActivityCategory.ADMINISTRATION, date: daysFromToday(10), estimatedMinutes: 120, actualMinutes: null, status: ActivityStatus.PLANNED, deadline: daysFromToday(20) },
    { title: 'Dataset Analysis for Research Grant', category: ActivityCategory.RESEARCH, date: daysFromToday(12), estimatedMinutes: 180, actualMinutes: null, status: ActivityStatus.PLANNED, deadline: daysFromToday(25) },
    { title: 'Final Year Student Mentoring Session', category: ActivityCategory.MENTORING, date: daysFromToday(14), estimatedMinutes: 90, actualMinutes: null, status: ActivityStatus.PLANNED, deadline: daysFromToday(28) },
  ];

  const f1Data = faculty1Activities.map(a => ({ ...a, facultyProfileId: f1ProfileId, description: `${a.title} - Academic Semester 2026-27` }));
  await prisma.activity.createMany({ data: f1Data });
  console.log(`  ✅ ${f1Data.length} activities created for Prof. Rahul Mehta`);

  // -------------------------------------------------------
  // HOD + Extra Faculty — bulk activities for HOD dashboard
  // -------------------------------------------------------
  const bulkFaculties = [
    { profile: hodUser.facultyProfile!, label: 'HOD' },
    ...extraFaculties.map((f, i) => ({ profile: f.facultyProfile!, label: `ExtraFac${i + 1}` })),
  ];

  const bulkCategories: { category: ActivityCategory; est: number; title: string }[] = [
    { category: ActivityCategory.TEACHING, est: 60, title: 'Lecture Session' },
    { category: ActivityCategory.TEACHING, est: 60, title: 'Tutorial Class' },
    { category: ActivityCategory.PREPARATION, est: 90, title: 'Lecture Preparation' },
    { category: ActivityCategory.EVALUATION, est: 120, title: 'Assignment Evaluation' },
    { category: ActivityCategory.RESEARCH, est: 150, title: 'Research Activity' },
    { category: ActivityCategory.MEETING, est: 60, title: 'Department Meeting' },
    { category: ActivityCategory.MENTORING, est: 45, title: 'Student Mentoring' },
    { category: ActivityCategory.ADMINISTRATION, est: 60, title: 'Administrative Task' },
    { category: ActivityCategory.PROJECT_SUPERVISION, est: 90, title: 'Project Supervision' },
    { category: ActivityCategory.LABORATORY, est: 120, title: 'Lab Session' },
  ];

  const bulkData: any[] = [];
  for (const fac of bulkFaculties) {
    // Historical: 60 days back
    for (let dAgo = 60; dAgo >= 1; dAgo--) {
      const date = daysAgo(dAgo);
      if (date.getDay() === 0) continue; // skip Sundays
      const perDay = date.getDay() === 6 ? 2 : 4; // sat=2, weekday=4
      for (let i = 0; i < perDay; i++) {
        const tmpl = bulkCategories[i % bulkCategories.length];
        const variation = (i % 3) * 10;
        const est = tmpl.est + variation;
        const actual = est + ((i % 2 === 0) ? 10 : -5);
        bulkData.push({
          facultyProfileId: fac.profile.id,
          title: `${tmpl.title}`,
          category: tmpl.category,
          date: new Date(date),
          estimatedMinutes: est,
          actualMinutes: actual,
          status: ActivityStatus.COMPLETED,
          description: `${tmpl.title} session`,
        });
      }
    }
    // Future: 14 days forward
    for (let dFwd = 1; dFwd <= 14; dFwd++) {
      const date = daysFromToday(dFwd);
      if (date.getDay() === 0) continue;
      const perDay = 3;
      for (let i = 0; i < perDay; i++) {
        const tmpl = bulkCategories[i % bulkCategories.length];
        bulkData.push({
          facultyProfileId: fac.profile.id,
          title: tmpl.title,
          category: tmpl.category,
          date: new Date(date),
          estimatedMinutes: tmpl.est,
          actualMinutes: null,
          status: ActivityStatus.PLANNED,
          deadline: i === 0 ? daysFromToday(dFwd + 7) : null,
          description: `${tmpl.title} session`,
        });
      }
    }
  }

  const chunkSize = 200;
  for (let i = 0; i < bulkData.length; i += chunkSize) {
    await prisma.activity.createMany({ data: bulkData.slice(i, i + chunkSize) });
  }
  console.log(`  ✅ ${bulkData.length} activities created for HOD + extra faculties`);

  // --------------------------------------------------
  // 4. Summary
  // --------------------------------------------------
  console.log('\n📋 Demo Accounts:');
  console.log('  ┌──────────────────────────────────────────────────────────┐');
  console.log('  │ Role    │ Email                           │ Password        │');
  console.log('  ├──────────────────────────────────────────────────────────┤');
  console.log('  │ ADMIN   │ admin.demo@facultyflow.local    │ FacultyFlow@123 │');
  console.log('  │ HOD     │ hod.demo@facultyflow.local      │ FacultyFlow@123 │');
  console.log('  │ FACULTY │ faculty.demo@facultyflow.local  │ FacultyFlow@123 │');
  console.log('  └──────────────────────────────────────────────────────────┘');
  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
