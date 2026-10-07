const fs = require('fs');

const dateToday = new Date('2026-10-08T10:00:00Z');

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const hodProfile = {
  id: "hod-profile-id",
  userId: "hod-user-id",
  firstName: "Dr. Darshan",
  lastName: "Kulkarni",
  designation: "Head of Department",
  departmentId: "ce-dept-id"
};

const facultyProfile = {
  id: "fac-profile-id",
  userId: "fac-user-id",
  firstName: "Prof. Rahul",
  lastName: "Mehta",
  designation: "Assistant Professor",
  departmentId: "ce-dept-id"
};

const activities = [];

const categories = [
  { c: 'TEACHING', t: ['DBMS Lecture', 'Data Structures Lecture', 'Operating Systems Lecture', 'Computer Networks Lecture', 'Software Engineering Lecture'], prob: 0.35, est: [60, 90, 120] },
  { c: 'PREPARATION', t: ['DBMS Lecture Preparation', 'Unit 4 Lecture Notes', 'Lab Manual Preparation', 'Question Paper Preparation'], prob: 0.15, est: [60, 90, 120] },
  { c: 'EVALUATION', t: ['Lab Assignment Evaluation', 'Assignment Evaluation', 'Internal Assessment', 'Midterm Paper Evaluation'], prob: 0.15, est: [90, 120, 180] },
  { c: 'RESEARCH', t: ['Research Paper Reading', 'Literature Review', 'Research Paper Draft', 'Dataset Analysis'], prob: 0.15, est: [120, 150, 180, 240] },
  { c: 'MEETING', t: ['Department Meeting', 'Faculty Coordination Meeting', 'Project Review Meeting'], prob: 0.10, est: [60, 90] },
  { c: 'ADMINISTRATION', t: ['Course File Preparation', 'Attendance Review', 'Department Documentation'], prob: 0.05, est: [60, 90] },
  { c: 'MENTORING', t: ['Student Mentoring', 'Final Year Project Guidance'], prob: 0.05, est: [30, 60] }
];

function getRandomCategory() {
  const r = Math.random();
  let acc = 0;
  for (const cat of categories) {
    acc += cat.prob;
    if (r <= acc) return cat;
  }
  return categories[0];
}

// Generate past 30 days and future 23 days for Rahul Mehta
for (let i = -30; i <= 23; i++) {
  const date = addDays(dateToday, i);
  if (date.getDay() === 0) continue; // Skip Sunday

  const dailyCount = date.getDay() === 6 ? 1 : Math.floor(Math.random() * 3) + 2;
  
  for (let j = 0; j < dailyCount; j++) {
    const cat = getRandomCategory();
    const est = cat.est[Math.floor(Math.random() * cat.est.length)];
    const title = cat.t[Math.floor(Math.random() * cat.t.length)];
    
    let status;
    let actual = null;
    let deadline = null;

    if (i < 0) {
      status = 'COMPLETED';
      actual = est + (Math.floor(Math.random() * 30) - 15);
      if (actual < 15) actual = 15;
    } else {
      status = i === 0 && Math.random() > 0.5 ? 'IN_PROGRESS' : 'PLANNED';
      if (Math.random() > 0.3) {
        deadline = addDays(date, Math.floor(Math.random() * 7) + 1).toISOString();
      }
    }

    // Force some high priorities
    if (i >= 0 && i <= 3 && j === 0) {
       deadline = addDays(dateToday, 1).toISOString(); // urgent
    }

    activities.push({
      id: `act-${i}-${j}`,
      facultyProfileId: facultyProfile.id,
      title,
      category: cat.c,
      date: date.toISOString(),
      estimatedMinutes: est,
      actualMinutes: actual,
      status,
      deadline,
      priorityScore: null,
      priorityLevel: null
    });
  }
}

// HOD Dashboard dummy faculty list
const departmentFaculty = [
  { id: facultyProfile.id, name: 'Prof. Rahul Mehta', employeeId: 'CE-FAC-001', actualMinutes: 2400, estimatedMinutes: 2600, activityCount: 45, workloadStatus: 'NORMAL', utilizationPercent: 85, varianceMinutes: -200, completionRate: 90, overdueCount: 1 },
  { id: 'f2', name: 'Dr. A. Sharma', employeeId: 'CE-FAC-002', actualMinutes: 3200, estimatedMinutes: 3000, activityCount: 52, workloadStatus: 'HIGH', utilizationPercent: 110, varianceMinutes: 200, completionRate: 95, overdueCount: 0 },
  { id: 'f3', name: 'Dr. S. Patil', employeeId: 'CE-FAC-003', actualMinutes: 2100, estimatedMinutes: 2100, activityCount: 40, workloadStatus: 'NORMAL', utilizationPercent: 75, varianceMinutes: 0, completionRate: 85, overdueCount: 2 },
  { id: 'f4', name: 'Dr. K. Kulkarni', employeeId: 'CE-FAC-004', actualMinutes: 3500, estimatedMinutes: 3200, activityCount: 60, workloadStatus: 'OVERLOADED', utilizationPercent: 125, varianceMinutes: 300, completionRate: 80, overdueCount: 4 },
  { id: 'f5', name: 'Dr. P. Joshi', employeeId: 'CE-FAC-005', actualMinutes: 2500, estimatedMinutes: 2600, activityCount: 42, workloadStatus: 'NORMAL', utilizationPercent: 88, varianceMinutes: -100, completionRate: 92, overdueCount: 0 },
  { id: 'f6', name: 'Dr. R. Desai', employeeId: 'CE-FAC-006', actualMinutes: 2300, estimatedMinutes: 2400, activityCount: 38, workloadStatus: 'NORMAL', utilizationPercent: 82, varianceMinutes: -100, completionRate: 88, overdueCount: 1 },
  { id: 'f7', name: 'Dr. M. Gupta', employeeId: 'CE-FAC-007', actualMinutes: 1900, estimatedMinutes: 2000, activityCount: 35, workloadStatus: 'LOW', utilizationPercent: 65, varianceMinutes: -100, completionRate: 90, overdueCount: 0 },
  { id: 'f8', name: 'Dr. N. Verma', employeeId: 'CE-FAC-008', actualMinutes: 2600, estimatedMinutes: 2500, activityCount: 44, workloadStatus: 'NORMAL', utilizationPercent: 92, varianceMinutes: 100, completionRate: 87, overdueCount: 1 },
  { id: 'f9', name: 'Dr. T. Singh', employeeId: 'CE-FAC-009', actualMinutes: 2200, estimatedMinutes: 2300, activityCount: 41, workloadStatus: 'NORMAL', utilizationPercent: 78, varianceMinutes: -100, completionRate: 85, overdueCount: 2 },
  { id: 'f10', name: 'Dr. L. Yadav', employeeId: 'CE-FAC-010', actualMinutes: 2450, estimatedMinutes: 2400, activityCount: 43, workloadStatus: 'NORMAL', utilizationPercent: 86, varianceMinutes: 50, completionRate: 91, overdueCount: 0 }
];

const data = {
  activities,
  departmentFaculty
};

fs.writeFileSync('client/src/demo/demoData.json', JSON.stringify(data, null, 2));
console.log('Demo data generated.');
