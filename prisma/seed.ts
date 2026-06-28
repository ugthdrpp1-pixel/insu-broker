import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.claimDocument.deleteMany();
  await prisma.claimEvent.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.insurancePlan.deleteMany();
  await prisma.insuranceProduct.deleteMany();
  await prisma.document.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10);

  // ============================================
  // USERS
  // ============================================
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@insu.co.th',
      passwordHash,
      name: 'Admin Insu',
      role: 'ADMIN',
      phone: '081-111-1111',
      employeeCode: 'ADM001',
      department: 'IT',
      locale: 'th',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@insu.co.th',
      passwordHash,
      name: 'Somchai Manager',
      role: 'MANAGER',
      phone: '081-222-2222',
      employeeCode: 'MGR001',
      department: 'Sales',
      locale: 'th',
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      email: 'agent@insu.co.th',
      passwordHash,
      name: 'Wanchai Agent',
      role: 'AGENT',
      phone: '081-333-3333',
      employeeCode: 'AGT001',
      department: 'Sales',
      locale: 'th',
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      email: 'agent2@insu.co.th',
      passwordHash,
      name: 'Suda Agent',
      role: 'AGENT',
      phone: '081-444-4444',
      employeeCode: 'AGT002',
      department: 'Sales',
      locale: 'th',
    },
  });

  const agent3 = await prisma.user.create({
    data: {
      email: 'lina@insu.co.th',
      passwordHash,
      name: 'Lina Smith',
      role: 'AGENT',
      phone: '081-555-5555',
      employeeCode: 'AGT003',
      department: 'Sales',
      locale: 'en',
    },
  });

  // ============================================
  // CUSTOMERS
  // ============================================
  console.log('Creating customers...');
  const customers = await Promise.all([
    prisma.customerProfile.create({
      data: {
        customerCode: 'CUS0001',
        firstNameTh: 'สมชาย', lastNameTh: 'ใจดี',
        firstNameEn: 'Somchai', lastNameEn: 'Jaidee',
        idCardNumber: '1100100011111',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'MALE',
        occupation: 'Engineer',
        maritalStatus: 'MARRIED',
        phone: '089-111-1111',
        email: 'somchai@example.com',
        addressLine: '123/4 Sukhumvit Rd.',
        subDistrict: 'Khlong Toei',
        district: 'Khlong Toei',
        province: 'Bangkok',
        postalCode: '10110',
      },
    }),
    prisma.customerProfile.create({
      data: {
        customerCode: 'CUS0002',
        firstNameTh: 'สมหญิง', lastNameTh: 'สดใส',
        firstNameEn: 'Somying', lastNameEn: 'Sodsai',
        idCardNumber: '1100100022222',
        dateOfBirth: new Date('1990-08-22'),
        gender: 'FEMALE',
        occupation: 'Doctor',
        maritalStatus: 'SINGLE',
        phone: '089-222-2222',
        email: 'somying@example.com',
        addressLine: '456 Silom Rd.',
        subDistrict: 'Bang Rak',
        district: 'Bang Rak',
        province: 'Bangkok',
        postalCode: '10500',
      },
    }),
    prisma.customerProfile.create({
      data: {
        customerCode: 'CUS0003',
        firstNameTh: 'มานี', lastNameTh: 'รักไทย',
        firstNameEn: 'Manee', lastNameEn: 'Rakthai',
        idCardNumber: '1100100033333',
        dateOfBirth: new Date('1978-12-01'),
        gender: 'FEMALE',
        occupation: 'Teacher',
        maritalStatus: 'MARRIED',
        phone: '089-333-3333',
        email: 'manee@example.com',
        addressLine: '789 Ratchadaphisek Rd.',
        subDistrict: 'Huai Khwang',
        district: 'Huai Khwang',
        province: 'Bangkok',
        postalCode: '10310',
      },
    }),
    prisma.customerProfile.create({
      data: {
        customerCode: 'CUS0004',
        firstNameTh: 'ประยุทธ', lastNameTh: 'มั่นคง',
        firstNameEn: 'Prayut', lastNameEn: 'Mankhong',
        idCardNumber: '1100100044444',
        dateOfBirth: new Date('1995-03-10'),
        gender: 'MALE',
        occupation: 'Freelancer',
        maritalStatus: 'SINGLE',
        phone: '089-444-4444',
        email: 'prayut@example.com',
        addressLine: '321 Phetchaburi Rd.',
        subDistrict: 'Thanon Phetchaburi',
        district: 'Ratchathewi',
        province: 'Bangkok',
        postalCode: '10400',
      },
    }),
    prisma.customerProfile.create({
      data: {
        customerCode: 'CUS0005',
        firstNameTh: 'ใจดี', lastNameTh: 'มีสุข',
        firstNameEn: 'Jaidee', lastNameEn: 'Meesuk',
        idCardNumber: '1100100055555',
        dateOfBirth: new Date('1965-07-20'),
        gender: 'MALE',
        occupation: 'Retired',
        maritalStatus: 'MARRIED',
        phone: '089-555-5555',
        email: 'jaidee@example.com',
        addressLine: '555 Chiang Mai Rd.',
        subDistrict: 'Si Phum',
        district: 'Mueang Chiang Mai',
        province: 'Chiang Mai',
        postalCode: '50200',
      },
    }),
  ]);

  // ============================================
  // INSURANCE PRODUCTS
  // ============================================
  console.log('Creating products...');

  const productLife = await prisma.insuranceProduct.create({
    data: {
      code: 'LIFE-STD',
      type: 'LIFE',
      nameTh: 'ประกันชีวิต',
      nameEn: 'Life Insurance',
      descriptionTh: 'คุ้มครองชีวิตและสะสมทรัพย์ เพื่อความมั่นคงของครอบครัว',
      descriptionEn: 'Life coverage and savings for family security',
      iconName: 'Heart',
      displayOrder: 1,
      plans: {
        create: [
          {
            code: 'LIFE-SAVINGS-15',
            nameTh: 'แบบสะสมทรัพย์ 15 ปี',
            nameEn: 'Savings Plan 15Y',
            descriptionTh: 'ทุนประกันพร้อมเงินคืนตลอดสัญญา',
            minSumInsured: 100000,
            maxSumInsured: 10000000,
            minAge: 20, maxAge: 60,
            coverageDetails: JSON.stringify([
              { code: 'death', nameTh: 'คุ้มครองชีวิต', nameEn: 'Death Benefit', amount: 1000000 },
              { code: 'total_disability', nameTh: 'ทุพพลภาพถาวรสิ้นเชิง', nameEn: 'Total Disability', amount: 1000000 },
              { code: 'savings', nameTh: 'เงินคืนสะสมทรัพย์', nameEn: 'Savings Return', amount: 500000 },
            ]),
            exclusions: JSON.stringify(['ตั้งใจฆ่าตัวตายใน 2 ปีแรก', 'ซ่อนเร้นโรคร้ายแรง']),
            features: JSON.stringify(['ได้รับเงินคืนตามกำหนด', 'สามารถกู้ยืมได้', 'ลดหย่อนภาษีได้']),
          },
          {
            code: 'LIFE-TERM-30',
            nameTh: 'แบบชั่วระยะเวลา 30 ปี',
            nameEn: 'Term Plan 30Y',
            descriptionTh: 'คุ้มครองชีวิตระยะยาว เบี้ยประกันต่ำ',
            minSumInsured: 500000,
            maxSumInsured: 5000000,
            minAge: 18, maxAge: 65,
            coverageDetails: JSON.stringify([
              { code: 'death', nameTh: 'คุ้มครองชีวิต', nameEn: 'Death Benefit', amount: 2000000 },
            ]),
            exclusions: JSON.stringify(['ตั้งใจฆ่าตัวตาย', 'สงคราม']),
            features: JSON.stringify(['เบี้ยประกันต่ำ', 'คุ้มครองสูง', 'ลดหย่อนภาษี']),
          },
        ],
      },
    },
  });

  const productHealth = await prisma.insuranceProduct.create({
    data: {
      code: 'HEALTH-STD',
      type: 'HEALTH',
      nameTh: 'ประกันสุขภาพ',
      nameEn: 'Health Insurance',
      descriptionTh: 'ค่ารักษาพยาบาลทั้ง OPD และ IPD พร้อมความคุ้มครองที่ครอบคลุม',
      descriptionEn: 'Medical coverage for OPD and IPD with comprehensive benefits',
      iconName: 'Stethoscope',
      displayOrder: 2,
      plans: {
        create: [
          {
            code: 'HEALTH-BASIC',
            nameTh: 'แผนพื้นฐาน',
            nameEn: 'Basic Plan',
            descriptionTh: 'ค่ารักษาพยาบาล 1,000,000 บาท/ปี',
            minSumInsured: 500000,
            maxSumInsured: 1000000,
            minAge: 15, maxAge: 70,
            coverageDetails: JSON.stringify([
              { code: 'ipd', nameTh: 'ค่าห้อง/ค่าผ่าตัด IPD', nameEn: 'IPD Room/Surgery', amount: 500000 },
              { code: 'opd', nameTh: 'ค่ารักษา OPD', nameEn: 'OPD', amount: 30000 },
              { code: 'emergency', nameTh: 'ฉุกเฉิน', nameEn: 'Emergency', amount: 100000 },
            ]),
            exclusions: JSON.stringify(['ทันตกรรมเสริมความงาม', 'ศัลยกรรมตกแต่ง', 'อุบัติเหตุจากการดื่มสุรา']),
            features: JSON.stringify(['เคลมง่าย', 'โรงพยาบาลเครือข่าย 500+', 'ไม่ต้องสำรองจ่าย']),
          },
          {
            code: 'HEALTH-PREMIUM',
            nameTh: 'แผนพรีเมียม',
            nameEn: 'Premium Plan',
            descriptionTh: 'ค่ารักษาพยาบาล 5,000,000 บาท/ปี ครอบคลุมทุกอาการ',
            minSumInsured: 2000000,
            maxSumInsured: 10000000,
            minAge: 15, maxAge: 65,
            coverageDetails: JSON.stringify([
              { code: 'ipd', nameTh: 'ค่าห้อง/ค่าผ่าตัด IPD', nameEn: 'IPD Room/Surgery', amount: 3000000 },
              { code: 'opd', nameTh: 'ค่ารักษา OPD', nameEn: 'OPD', amount: 100000 },
              { code: 'dental', nameTh: 'ทันตกรรม', nameEn: 'Dental', amount: 30000 },
              { code: 'maternity', nameTh: 'คลอดบุตร', nameEn: 'Maternity', amount: 200000 },
              { code: 'emergency', nameTh: 'ฉุกเฉินทั่วโลก', nameEn: 'Global Emergency', amount: 5000000 },
            ]),
            exclusions: JSON.stringify(['ทันตกรรมเสริมความงาม', 'รักษาโรคจิต']),
            features: JSON.stringify(['เคลมทั่วโลก', 'ห้องพักเดี่ยว', 'ครอบคลุมมะเร็ง/ไตวายเรื้อรัง']),
          },
        ],
      },
    },
  });

  const productMotor = await prisma.insuranceProduct.create({
    data: {
      code: 'MOTOR-STD',
      type: 'MOTOR',
      nameTh: 'ประกันรถยนต์',
      nameEn: 'Motor Insurance',
      descriptionTh: 'ประกันภัยรถยนต์ทุกชั้น พร้อมบริการช่วยเหลือฉุกเฉิน 24 ชม.',
      descriptionEn: 'All-class motor insurance with 24/7 roadside assistance',
      iconName: 'Car',
      displayOrder: 3,
      plans: {
        create: [
          {
            code: 'MOTOR-CLASS1',
            nameTh: 'ประกันภัยชั้น 1',
            nameEn: 'Class 1',
            descriptionTh: 'ครอบคลุมครบทุกกรณี รวมภัยจากรถหาย/ไฟไหม้',
            minSumInsured: 100000,
            maxSumInsured: 5000000,
            minAge: 21, maxAge: 80,
            coverageDetails: JSON.stringify([
              { code: 'collision', nameTh: 'ชน/ชนกับสิ่งของ', nameEn: 'Collision', amount: 1000000 },
              { code: 'theft_fire', nameTh: 'รถหาย/ไฟไหม้', nameEn: 'Theft/Fire', amount: 1000000 },
              { code: 'flood', nameTh: 'น้ำท่วม', nameEn: 'Flood', amount: 1000000 },
              { code: 'third_party', nameTh: 'ความเสียหายต่อบุคคลภายนอก', nameEn: 'Third Party Liability', amount: 1000000 },
              { code: 'medical', nameTh: 'ค่ารักษาพยาบาล', nameEn: 'Medical', amount: 200000 },
            ]),
            exclusions: JSON.stringify(['ขับโดยไม่มีใบขับขี่', 'ใช้รถในทางผิดกฎหมาย']),
            features: JSON.stringify(['ช่วยเหลือฉุกเฉิน 24 ชม.', 'รถทดแทน', 'เคลมเร็ว']),
          },
          {
            code: 'MOTOR-CLASS2PLUS',
            nameTh: 'ประกันภัยชั้น 2+',
            nameEn: 'Class 2+',
            descriptionTh: 'ครอบคลุมรถหาย/ไฟไหม้/น้ำท่วม + ชน',
            minSumInsured: 100000,
            maxSumInsured: 3000000,
            coverageDetails: JSON.stringify([
              { code: 'collision', nameTh: 'ชน', nameEn: 'Collision', amount: 500000 },
              { code: 'theft_fire', nameTh: 'รถหาย/ไฟไหม้/น้ำท่วม', nameEn: 'Theft/Fire/Flood', amount: 1000000 },
            ]),
            features: JSON.stringify(['เบี้ยประกันประหยัด', 'ครอบคลุมภัยหลัก']),
          },
          {
            code: 'MOTOR-CLASS3',
            nameTh: 'ประกันภัยชั้น 3',
            nameEn: 'Class 3',
            descriptionTh: 'เฉพาะความเสียหายต่อรถชน',
            minSumInsured: 100000,
            maxSumInsured: 2000000,
            coverageDetails: JSON.stringify([
              { code: 'collision', nameTh: 'ชนเฉพาะรถ', nameEn: 'Collision Only', amount: 300000 },
            ]),
            features: JSON.stringify(['เบี้ยประกันถูกที่สุด', 'เหมาะรถเก่า']),
          },
          {
            code: 'MOTOR-PRB',
            nameTh: 'พ.ร.บ. รถยนต์',
            nameEn: 'Compulsory Motor Act',
            descriptionTh: 'คุ้มครองตามกฎหมายทุกรถยนต์',
            minSumInsured: 50000,
            maxSumInsured: 500000,
            coverageDetails: JSON.stringify([
              { code: 'death', nameTh: 'เสียชีวิต', nameEn: 'Death', amount: 500000 },
              { code: 'disability', nameTh: 'ทุพพลภาพ', nameEn: 'Disability', amount: 500000 },
              { code: 'medical', nameTh: 'ค่ารักษาพยาบาล', nameEn: 'Medical', amount: 80000 },
            ]),
            features: JSON.stringify(['ตามกฎหมายบังคับ', 'ราคาประหยัด']),
          },
        ],
      },
    },
  });

  const productPA = await prisma.insuranceProduct.create({
    data: {
      code: 'PA-STD',
      type: 'PA',
      nameTh: 'ประกันอุบัติเหตุส่วนบุคคล',
      nameEn: 'Personal Accident',
      descriptionTh: 'คุ้มครองอุบัติเหตุตลอด 24 ชั่วโมง ทั่วโลก',
      descriptionEn: '24/7 worldwide accident coverage',
      iconName: 'Shield',
      displayOrder: 4,
      plans: {
        create: [
          {
            code: 'PA-BASIC',
            nameTh: 'แผนพื้นฐาน',
            nameEn: 'Basic Plan',
            descriptionTh: 'คุ้มครอง 200,000 บาท',
            minSumInsured: 100000,
            maxSumInsured: 500000,
            minAge: 16, maxAge: 70,
            coverageDetails: JSON.stringify([
              { code: 'death', nameTh: 'เสียชีวิตจากอุบัติเหตุ', nameEn: 'Accidental Death', amount: 200000 },
              { code: 'disability', nameTh: 'ทุพพลภาพถาวร', nameEn: 'Permanent Disability', amount: 200000 },
              { code: 'medical', nameTh: 'ค่ารักษาพยาบาล', nameEn: 'Medical', amount: 20000 },
            ]),
            exclusions: JSON.stringify(['ขับรถจักรยานยนต์ไม่สวมหมวกกันน็อค', 'กีฬาอันตราย']),
            features: JSON.stringify(['เบี้ยประกันต่ำ', 'ครอบคลุมทั่วโลก']),
          },
          {
            code: 'PA-PREMIUM',
            nameTh: 'แผนพรีเมียม',
            nameEn: 'Premium Plan',
            descriptionTh: 'คุ้มครอง 1,000,000 บาท',
            minSumInsured: 500000,
            maxSumInsured: 3000000,
            coverageDetails: JSON.stringify([
              { code: 'death', nameTh: 'เสียชีวิตจากอุบัติเหตุ', nameEn: 'Accidental Death', amount: 1000000 },
              { code: 'disability', nameTh: 'ทุพพลภาพ', nameEn: 'Disability', amount: 1000000 },
              { code: 'medical', nameTh: 'ค่ารักษาพยาบาล', nameEn: 'Medical', amount: 100000 },
              { code: 'daily_compensation', nameTh: 'เงินชดเชยรายวัน', nameEn: 'Daily Compensation', amount: 1000 },
            ]),
            features: JSON.stringify(['ครอบคลุมสูง', 'กีฬาทุกประเภท']),
          },
        ],
      },
    },
  });

  const productProperty = await prisma.insuranceProduct.create({
    data: {
      code: 'PROPERTY-STD',
      type: 'PROPERTY',
      nameTh: 'ประกันทรัพย์สิน',
      nameEn: 'Property Insurance',
      descriptionTh: 'ประกันอัคคีภัย/บ้าน/คอนโด ครอบคลุมภัยธรรมชาติ',
      descriptionEn: 'Fire, home, and condo insurance against natural disasters',
      iconName: 'Home',
      displayOrder: 5,
      plans: {
        create: [
          {
            code: 'PROPERTY-HOME',
            nameTh: 'ประกันอัคคีภัยบ้าน',
            nameEn: 'Home Fire Insurance',
            descriptionTh: 'คุ้มครองบ้าน/ที่อยู่อาศัย',
            minSumInsured: 500000,
            maxSumInsured: 20000000,
            coverageDetails: JSON.stringify([
              { code: 'fire', nameTh: 'ไฟไหม้', nameEn: 'Fire', amount: 2000000 },
              { code: 'flood', nameTh: 'น้ำท่วม', nameEn: 'Flood', amount: 2000000 },
              { code: 'theft', nameTh: 'โจรกรรม', nameEn: 'Theft', amount: 500000 },
              { code: 'contents', nameTh: 'ทรัพย์สินภายใน', nameEn: 'Contents', amount: 500000 },
            ]),
            features: JSON.stringify(['ครอบคลุมหลายภัย', 'ทรัพย์สินภายใน']),
          },
          {
            code: 'PROPERTY-CONDO',
            nameTh: 'ประกันคอนโดมิเนียม',
            nameEn: 'Condo Insurance',
            descriptionTh: 'เหมาะสำหรับห้องชุดคอนโด',
            minSumInsured: 300000,
            maxSumInsured: 10000000,
            coverageDetails: JSON.stringify([
              { code: 'fire', nameTh: 'ไฟไหม้', nameEn: 'Fire', amount: 1000000 },
              { code: 'contents', nameTh: 'ทรัพย์สินในห้อง', nameEn: 'Contents', amount: 300000 },
              { code: 'liability', nameTh: 'ความรับผิดต่อบุคคลภายนอก', nameEn: 'Third Party Liability', amount: 200000 },
            ]),
            features: JSON.stringify(['ครอบคลุมห้องชุด', 'ไม่ต้องสำรองจ่าย']),
          },
        ],
      },
    },
  });

  // ============================================
  // RATE CARDS (samples)
  // ============================================
  console.log('Creating rate cards...');
  const products = [productLife, productHealth, productMotor, productPA, productProperty];
  for (const p of products) {
    await prisma.rateCard.create({
      data: { productId: p.id, minAge: 18, maxAge: 35, baseRate: 2.5, multiplier: 1.0 },
    });
    await prisma.rateCard.create({
      data: { productId: p.id, minAge: 36, maxAge: 55, baseRate: 4.0, multiplier: 1.1 },
    });
    await prisma.rateCard.create({
      data: { productId: p.id, minAge: 56, maxAge: 80, baseRate: 7.0, multiplier: 1.3 },
    });
  }

  // ============================================
  // LEADS
  // ============================================
  console.log('Creating leads...');
  const allProducts = await prisma.insuranceProduct.findMany();
  await prisma.lead.createMany({
    data: [
      { firstName: 'ใจดี', lastName: 'มาเยือน', phone: '088-111-2222', email: 'jd@example.com', source: 'WEBSITE', status: 'NEW', interestedProduct: 'LIFE', agentId: agent1.id },
      { firstName: 'พอใจ', lastName: 'บริการ', phone: '088-222-3333', email: 'pj@example.com', source: 'REFERRAL', status: 'CONTACTED', interestedProduct: 'HEALTH', agentId: agent1.id, followUpAt: new Date(Date.now() + 86400000) },
      { firstName: 'ดีใจ', lastName: 'พบเรา', phone: '088-333-4444', source: 'WALK_IN', status: 'QUALIFIED', interestedProduct: 'MOTOR', agentId: agent2.id },
      { firstName: 'John', lastName: 'Doe', phone: '088-444-5555', email: 'john@example.com', source: 'SOCIAL', status: 'NEGOTIATING', interestedProduct: 'PROPERTY', agentId: agent3.id },
      { firstName: 'Jane', lastName: 'Smith', phone: '088-555-6666', source: 'ADVERTISEMENT', status: 'CONVERTED', interestedProduct: 'PA', agentId: agent2.id, convertedAt: new Date() },
    ],
  });

  // ============================================
  // POLICIES (sample)
  // ============================================
  console.log('Creating policies...');
  const lifePlans = await prisma.insurancePlan.findMany({ where: { product: { type: 'LIFE' } } });
  const healthPlans = await prisma.insurancePlan.findMany({ where: { product: { type: 'HEALTH' } } });
  const motorPlans = await prisma.insurancePlan.findMany({ where: { product: { type: 'MOTOR' } } });
  const paPlans = await prisma.insurancePlan.findMany({ where: { product: { type: 'PA' } } });
  const propertyPlans = await prisma.insurancePlan.findMany({ where: { product: { type: 'PROPERTY' } } });

  const policy1 = await prisma.policy.create({
    data: {
      policyNumber: 'POL-2024-0001',
      customerId: customers[0].id,
      agentId: agent1.id,
      productId: productLife.id,
      planId: lifePlans[0].id,
      coverageTerm: 15,
      sumInsured: 1000000,
      premium: 25000,
      paymentFreq: 'ANNUAL',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2039-01-15'),
      nextRenewalDate: new Date('2025-01-15'),
      status: 'ACTIVE',
      beneficiaries: {
        create: [{ firstName: 'สมหญิง', lastName: 'ใจดี', relation: 'SPOUSE', percentage: 100, isPrimary: true }],
      },
    },
  });

  const policy2 = await prisma.policy.create({
    data: {
      policyNumber: 'POL-2024-0002',
      customerId: customers[1].id,
      agentId: agent1.id,
      productId: productHealth.id,
      planId: healthPlans[1].id,
      coverageTerm: 1,
      sumInsured: 5000000,
      premium: 45000,
      paymentFreq: 'ANNUAL',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-06-01'),
      nextRenewalDate: new Date('2025-06-01'),
      status: 'ACTIVE',
    },
  });

  const policy3 = await prisma.policy.create({
    data: {
      policyNumber: 'POL-2024-0003',
      customerId: customers[2].id,
      agentId: agent2.id,
      productId: productMotor.id,
      planId: motorPlans[0].id,
      coverageTerm: 1,
      sumInsured: 800000,
      premium: 18000,
      paymentFreq: 'ANNUAL',
      startDate: new Date('2024-03-20'),
      endDate: new Date('2025-03-20'),
      nextRenewalDate: new Date('2025-03-20'),
      status: 'ACTIVE',
    },
  });

  const policy4 = await prisma.policy.create({
    data: {
      policyNumber: 'POL-2024-0004',
      customerId: customers[3].id,
      agentId: agent3.id,
      productId: productPA.id,
      planId: paPlans[0].id,
      coverageTerm: 1,
      sumInsured: 1000000,
      premium: 3500,
      paymentFreq: 'ANNUAL',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-09-01'),
      status: 'ACTIVE',
    },
  });

  const policy5 = await prisma.policy.create({
    data: {
      policyNumber: 'POL-2023-0099',
      customerId: customers[4].id,
      agentId: agent1.id,
      productId: productProperty.id,
      planId: propertyPlans[0].id,
      coverageTerm: 1,
      sumInsured: 3000000,
      premium: 5500,
      paymentFreq: 'ANNUAL',
      startDate: new Date('2023-11-01'),
      endDate: new Date('2024-11-01'),
      status: 'EXPIRED',
    },
  });

  // ============================================
  // PAYMENTS
  // ============================================
  console.log('Creating payments...');
  for (const p of [policy1, policy2, policy3, policy4, policy5]) {
    await prisma.payment.create({
      data: {
        receiptNumber: `REC-${p.policyNumber}`,
        policyId: p.id,
        customerId: p.customerId,
        amount: p.premium,
        method: 'TRANSFER',
        type: 'PREMIUM',
        status: 'PAID',
        paidAt: p.startDate,
        reference: `TRF-${Math.random().toString(36).substring(7).toUpperCase()}`,
        receivedById: agent1.id,
      },
    });
  }

  // ============================================
  // COMMISSIONS
  // ============================================
  console.log('Creating commissions...');
  await prisma.commission.create({
    data: { agentId: agent1.id, policyId: policy1.id, amount: policy1.premium * 0.15, rate: 15.0, status: 'PAID', paidAt: new Date() },
  });
  await prisma.commission.create({
    data: { agentId: agent1.id, policyId: policy2.id, amount: policy2.premium * 0.12, rate: 12.0, status: 'APPROVED' },
  });
  await prisma.commission.create({
    data: { agentId: agent2.id, policyId: policy3.id, amount: policy3.premium * 0.10, rate: 10.0, status: 'PAID', paidAt: new Date() },
  });
  await prisma.commission.create({
    data: { agentId: agent3.id, policyId: policy4.id, amount: policy4.premium * 0.20, rate: 20.0, status: 'PENDING' },
  });

  // ============================================
  // CLAIMS
  // ============================================
  console.log('Creating claims...');
  const claim1 = await prisma.claim.create({
    data: {
      claimNumber: 'CLM-2024-0001',
      policyId: policy3.id,
      productId: productMotor.id,
      customerId: customers[2].id,
      agentId: agent2.id,
      incidentDate: new Date('2024-05-10'),
      description: 'รถชนท้ายรถยนต์คันอื่น มีความเสียหายที่กันชนหลัง',
      incidentPlace: 'ถนนเพลินจิต',
      claimAmount: 35000,
      approvedAmount: 28000,
      status: 'PAID',
      paymentDate: new Date('2024-05-25'),
    },
  });

  await prisma.claimEvent.createMany({
    data: [
      { claimId: claim1.id, status: 'SUBMITTED', note: 'ลูกค้าแจ้งเคลมผ่านเบอร์ hotline' },
      { claimId: claim1.id, status: 'UNDER_REVIEW', note: 'เจ้าหน้าที่ประเมินความเสียหาย' },
      { claimId: claim1.id, status: 'APPROVED', note: 'อนุมัติจ่าย 28,000 บาท' },
      { claimId: claim1.id, status: 'PAID', note: 'โอนเงินแล้วเมื่อ 25/05/2024' },
    ],
  });

  await prisma.claim.create({
    data: {
      claimNumber: 'CLM-2024-0002',
      policyId: policy2.id,
      productId: productHealth.id,
      customerId: customers[1].id,
      agentId: agent1.id,
      incidentDate: new Date('2024-08-15'),
      description: 'เข้ารับการผ่าตัดไส้ติ่งอักเสบ ที่ รพ.บำรุงราษฎร์',
      claimAmount: 95000,
      approvedAmount: 85000,
      status: 'UNDER_REVIEW',
    },
  });

  // ============================================
  // NOTIFICATIONS
  // ============================================
  console.log('Creating notifications...');
  await prisma.notification.createMany({
    data: [
      { userId: agent1.id, title: 'ลูกค้าต่ออายุใกล้ครบกำหนด', message: 'POL-2024-0001 จะครบกำหนดต่ออายุในอีก 30 วัน', type: 'WARNING', link: '/policies/POL-2024-0001' },
      { userId: agent1.id, title: 'เคลมใหม่', message: 'ได้รับแจ้งเคลมใหม่จาก CUS0002', type: 'INFO', link: '/claims' },
      { userId: agent2.id, title: 'ค่าคอมมิชชั่นอนุมัติแล้ว', message: 'ค่าคอมมิชชั่น POL-2024-0003 ได้รับการอนุมัติ', type: 'SUCCESS' },
    ],
  });

  console.log('Seed completed!');
  console.log('');
  console.log('Login credentials (password: password123):');
  console.log('   admin@insu.co.th (ADMIN)');
  console.log('   manager@insu.co.th (MANAGER)');
  console.log('   agent@insu.co.th (AGENT)');
  console.log('   agent2@insu.co.th (AGENT)');
  console.log('   lina@insu.co.th (AGENT, EN)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
