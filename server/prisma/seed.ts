import { PrismaClient, Role, ActivityCategory, ActivityStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

  const mecDept = await prisma.department.upsert({
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
      name: 'Dr. Anjali Sharma',
      email: 'hod.demo@facultyflow.local',
      passwordHash: hash,
      role: Role.HOD,
      facultyProfile: {
        create: {
          firstName: 'Dr. Anjali',
          lastName: 'Sharma',
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

  // Faculty 1 — CE
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
          bio: 'Specializes in Databases and Web Technologies.',
        },
      },
    },
    include: { facultyProfile: true },
  });

  // Faculty 2 — CE
  const faculty2 = await prisma.user.upsert({
    where: { email: 'faculty2.demo@facultyflow.local' },
    update: {},
    create: {
      name: 'Prof. Priya Patel',
      email: 'faculty2.demo@facultyflow.local',
      passwordHash: hash,
      role: Role.FACULTY,
      facultyProfile: {
        create: {
          firstName: 'Prof. Priya',
          lastName: 'Patel',
          designation: 'Associate Professor',
          departmentId: ceDept.id,
          employeeId: 'CE-FAC-002',
        },
      },
    },
    include: { facultyProfile: true },
  });

  // Faculty 3 — IT
  const faculty3 = await prisma.user.upsert({
    where: { email: 'faculty3.demo@facultyflow.local' },
    update: {},
    create: {
      name: 'Prof. Vijay Kumar',
      email: 'faculty3.demo@facultyflow.local',
      passwordHash: hash,
      role: Role.FACULTY,
      facultyProfile: {
        create: {
          firstName: 'Prof. Vijay',
          lastName: 'Kumar',
          designation: 'Assistant Professor',
          departmentId: itDept.id,
          employeeId: 'IT-FAC-001',
        },
      },
    },
    include: { facultyProfile: true },
  });

  // Additional Faculties for Data Heavy HOD Dashboard
  const extraFaculties = [];
  for (let i = 4; i <= 8; i++) {
    const fac = await prisma.user.upsert({
      where: { email: `faculty${i}.demo@facultyflow.local` },
      update: {},
      create: {
        name: `Prof. Demo Faculty ${i}`,
        email: `faculty${i}.demo@facultyflow.local`,
        passwordHash: hash,
        role: Role.FACULTY,
        facultyProfile: {
          create: {
            firstName: `Prof. Demo`,
            lastName: `Faculty ${i}`,
            designation: 'Assistant Professor',
            departmentId: ceDept.id, // Adding to CE to make HOD Dashboard rich
            employeeId: `CE-FAC-00${i}`,
          },
        },
      },
      include: { facultyProfile: true },
    });
    extraFaculties.push(fac);
  }

  console.log('  ✅ Users created');

  // --------------------------------------------------
  // 3. Activities — generate realistic historical data
  // --------------------------------------------------
  const faculties = [
    { profile: hodUser.facultyProfile!, label: 'HOD' },
    { profile: faculty1.facultyProfile!, label: 'Faculty1' },
    { profile: faculty2.facultyProfile!, label: 'Faculty2' },
    { profile: faculty3.facultyProfile!, label: 'Faculty3' },
    ...extraFaculties.map((f, i) => ({ profile: f.facultyProfile!, label: `Faculty${i + 4}` })),
  ];

  const categories: { category: ActivityCategory; est: number; label: string }[] = [
    { category: ActivityCategory.TEACHING, est: 60, label: 'DBMS Lecture' },
    { category: ActivityCategory.TEACHING, est: 60, label: 'Algorithm Lecture' },
    { category: ActivityCategory.PREPARATION, est: 45, label: 'Lecture Preparation' },
    { category: ActivityCategory.EVALUATION, est: 90, label: 'Assignment Evaluation' },
    { category: ActivityCategory.RESEARCH, est: 120, label: 'Research Work' },
    { category: ActivityCategory.MEETING, est: 60, label: 'Department Meeting' },
    { category: ActivityCategory.MENTORING, est: 30, label: 'Student Mentoring' },
    { category: ActivityCategory.ADMINISTRATION, est: 45, label: 'Administrative Task' },
    { category: ActivityCategory.PROJECT_SUPERVISION, est: 60, label: 'Project Supervision' },
    { category: ActivityCategory.LABORATORY, est: 120, label: 'Lab Session' },
  ];

  // Delete old demo activities to avoid duplicates
  const allProfileIds = faculties.map(f => f.profile.id);
  await prisma.activity.deleteMany({
    where: { facultyProfileId: { in: allProfileIds } },
  });

  const today = new Date();
  const activityData: any[] = [];

  // Generate 90 days of historical activities
  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dayOfWeek = date.getDay();

    // Skip Sundays (0), lighter on Saturdays (6)
    if (dayOfWeek === 0) continue;

    for (const fac of faculties) {
      // How many activities per day: 3 to 6 on weekdays to make it data heavy
      const activitiesPerDay = dayOfWeek === 6 ? 2 : Math.floor(Math.random() * 4) + 3;

      for (let i = 0; i < activitiesPerDay; i++) {
        const template = categories[Math.floor(Math.random() * categories.length)];
        const est = template.est + Math.floor(Math.random() * 30) - 15;
        const actual = daysAgo > 7 
          ? est + Math.floor(Math.random() * 30) - 10
          : (Math.random() > 0.5 ? est + Math.floor(Math.random() * 20) - 5 : null);
        const status: ActivityStatus = daysAgo > 7 
          ? (Math.random() > 0.1 ? ActivityStatus.COMPLETED : ActivityStatus.CANCELLED)
          : (Math.random() > 0.6 ? ActivityStatus.COMPLETED : Math.random() > 0.5 ? ActivityStatus.IN_PROGRESS : ActivityStatus.PLANNED);

        activityData.push({
          facultyProfileId: fac.profile.id,
          title: template.label + (i > 0 ? ` - Session ${i + 1}` : ''),
          category: template.category,
          date: new Date(date),
          estimatedMinutes: Math.max(15, est),
          actualMinutes: actual ? Math.max(15, actual) : null,
          status,
          description: `${template.label} session for the academic semester.`,
        });
      }
    }
  }

  // Future activities (upcoming, 30 days forward)
  for (let daysFwd = 1; daysFwd <= 30; daysFwd++) {
    const date = new Date(today);
    date.setDate(date.getDate() + daysFwd);
    if (date.getDay() === 0) continue;

    for (const fac of faculties) {
      // 3 to 6 activities per day for future as well
      const activitiesPerDay = date.getDay() === 6 ? 2 : Math.floor(Math.random() * 4) + 3;
      for (let i = 0; i < activitiesPerDay; i++) {
        const template = categories[Math.floor(Math.random() * categories.length)];
        const est = template.est + Math.floor(Math.random() * 20) - 10;
        const deadline = Math.random() > 0.7 ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
        activityData.push({
          facultyProfileId: fac.profile.id,
          title: template.label,
          category: template.category,
          date: new Date(date),
          estimatedMinutes: Math.max(15, est),
          actualMinutes: null,
          status: ActivityStatus.PLANNED,
          deadline,
        });
      }
    }
  }

  // Bulk insert in chunks to avoid hitting limits
  const chunkSize = 100;
  for (let i = 0; i < activityData.length; i += chunkSize) {
    await prisma.activity.createMany({ data: activityData.slice(i, i + chunkSize) });
  }

  console.log(`  ✅ ${activityData.length} activities created`);

  // --------------------------------------------------
  // 4. Summary
  // --------------------------------------------------
  console.log('\n📋 Demo Accounts:');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log('  │ Role    │ Email                          │ Password   │');
  console.log('  ├─────────────────────────────────────────────────────┤');
  console.log('  │ ADMIN   │ admin.demo@facultyflow.local   │ FacultyFlow@123 │');
  console.log('  │ HOD     │ hod.demo@facultyflow.local     │ FacultyFlow@123 │');
  console.log('  │ FACULTY │ faculty.demo@facultyflow.local │ FacultyFlow@123 │');
  console.log('  │ FACULTY │ faculty2.demo@facultyflow.local│ FacultyFlow@123 │');
  console.log('  └─────────────────────────────────────────────────────┘');
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
