const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Clean existing data in reverse order of foreign keys
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.fine.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.bookTransaction.deleteMany({});
  await prisma.digitalFile.deleteMany({});
  await prisma.folder.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.setting.deleteMany({});

  // 1. System Settings
  const settings = [
    { key: 'FINE_PER_DAY', value: '1.00', description: 'Daily late fine amount in USD' },
    { key: 'BORROW_DURATION_DAYS', value: '14', description: 'Standard loan duration in days' },
    { key: 'MAX_BOOKS_STUDENT', value: '4', description: 'Maximum active borrowed books allowed per student' },
    { key: 'LIBRARY_NAME', value: 'AuraLib Central University Library', description: 'Official institution library name' },
    { key: 'LIBRARY_EMAIL', value: 'library@university.edu', description: 'Contact email' },
    { key: 'LIBRARY_PHONE', value: '+1 (555) 234-5678', description: 'Library helpdesk phone' },
    { key: 'ALLOW_STUDENT_RESERVATIONS', value: 'true', description: 'Whether students can reserve books online' },
  ];

  for (const s of settings) {
    await prisma.setting.create({ data: s });
  }
  console.log('✓ System Settings created');

  // 2. Users & Members
  const adminPassword = await bcrypt.hash('admin123', 10);
  const librarianPassword = await bcrypt.hash('librarian123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Eleanor Vance (Chief Administrator)',
      email: 'admin@library.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const librarian = await prisma.user.create({
    data: {
      name: 'Arthur Pendelton (Senior Librarian)',
      email: 'librarian@library.com',
      password: librarianPassword,
      role: 'LIBRARIAN',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const studentUser1 = await prisma.user.create({
    data: {
      name: 'Sarah Connor (Student)',
      email: 'student@library.com',
      password: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const studentMember1 = await prisma.member.create({
    data: {
      userId: studentUser1.id,
      rollNumber: 'CS-2024-042',
      regNumber: 'REG-987410',
      department: 'Computer Science & Engineering',
      course: 'B.Tech in Artificial Intelligence',
      phone: '+1 (555) 301-8842',
      address: 'West Wing Hall 4B, Campus Hostel',
      maxBooksAllowed: 4,
      status: 'ACTIVE',
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      name: 'David Kim',
      email: 'david.k@library.com',
      password: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const studentMember2 = await prisma.member.create({
    data: {
      userId: studentUser2.id,
      rollNumber: 'DS-2024-019',
      regNumber: 'REG-987411',
      department: 'Data Science & Analytics',
      course: 'M.Sc Data Science',
      phone: '+1 (555) 412-9901',
      address: '742 Evergreen Terrace, Apt 3',
      maxBooksAllowed: 5,
      status: 'ACTIVE',
    },
  });

  const studentUser3 = await prisma.user.create({
    data: {
      name: 'Maya Lin',
      email: 'maya.l@library.com',
      password: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    },
  });

  const studentMember3 = await prisma.member.create({
    data: {
      userId: studentUser3.id,
      rollNumber: 'SE-2023-108',
      regNumber: 'REG-987412',
      department: 'Software Engineering',
      course: 'B.Tech Software Systems',
      phone: '+1 (555) 523-7711',
      address: 'North Dorms Room 204',
      maxBooksAllowed: 4,
      status: 'ACTIVE',
    },
  });

  console.log('✓ Users and Member profiles created');

  // 3. Categories
  const categoriesData = [
    { name: 'Computer Science & IT', slug: 'computer-science-it', description: 'Computing, algorithms, distributed systems, architecture' },
    { name: 'Data Science & AI', slug: 'data-science-ai', description: 'Machine learning, deep learning, NLP, statistics' },
    { name: 'Software Engineering', slug: 'software-engineering', description: 'Design patterns, agile practices, architecture, clean code' },
    { name: 'Mathematics & Statistics', slug: 'mathematics-statistics', description: 'Calculus, linear algebra, discrete math, probability' },
    { name: 'Physics & Electronics', slug: 'physics-electronics', description: 'Circuits, semiconductor physics, quantum fundamentals' },
    { name: 'Business & Management', slug: 'business-management', description: 'Tech leadership, product management, entrepreneurship' },
    { name: 'Humanities & Research', slug: 'humanities-research', description: 'Academic writing, ethics in computing, philosophy of tech' },
  ];

  const categories = {};
  for (const c of categoriesData) {
    const created = await prisma.category.create({ data: c });
    categories[c.name] = created.id;
  }
  console.log('✓ Book Categories created');

  // 4. Books
  const booksData = [
    {
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      isbn: '978-0132350884',
      publisher: 'Prentice Hall',
      pubYear: 2008,
      categoryId: categories['Software Engineering'],
      language: 'English',
      description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. A timeless guide to writing readable, maintainable software.',
      totalCopies: 6,
      availableCopies: 4,
      shelfNumber: 'A-12-04',
      coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400',
    },
    {
      title: 'Introduction to Algorithms (4th Edition)',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      isbn: '978-0262046305',
      publisher: 'The MIT Press',
      pubYear: 2022,
      categoryId: categories['Computer Science & IT'],
      language: 'English',
      description: 'Comprehensive, rigorous textbook covering algorithms, data structures, dynamic programming, graph algorithms, and NP-completeness.',
      totalCopies: 8,
      availableCopies: 6,
      shelfNumber: 'B-01-01',
      coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400',
    },
    {
      title: 'Artificial Intelligence: A Modern Approach (4th Edition)',
      author: 'Stuart Russell, Peter Norvig',
      isbn: '978-0134610993',
      publisher: 'Pearson',
      pubYear: 2020,
      categoryId: categories['Data Science & AI'],
      language: 'English',
      description: 'The authoritative, leading textbook in artificial intelligence, covering probabilistic reasoning, deep learning, multi-agent systems, and ethics.',
      totalCopies: 5,
      availableCopies: 3,
      shelfNumber: 'B-04-12',
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    },
    {
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '978-1449373320',
      publisher: "O'Reilly Media",
      pubYear: 2017,
      categoryId: categories['Computer Science & IT'],
      language: 'English',
      description: 'The definitive guide to the architecture and principles behind reliable, scalable, and maintainable data storage and distributed stream processing.',
      totalCopies: 7,
      availableCopies: 5,
      shelfNumber: 'A-08-02',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    },
    {
      title: 'Deep Learning',
      author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
      isbn: '978-0262035613',
      publisher: 'The MIT Press',
      pubYear: 2016,
      categoryId: categories['Data Science & AI'],
      language: 'English',
      description: 'Foundations of mathematical deep learning, including autoencoders, CNNs, RNNs, generative modeling, and optimization techniques.',
      totalCopies: 4,
      availableCopies: 3,
      shelfNumber: 'B-05-09',
      coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
    },
    {
      title: 'The Pragmatic Programmer: 20th Anniversary Edition',
      author: 'David Thomas, Andrew Hunt',
      isbn: '978-0135957059',
      publisher: 'Addison-Wesley Professional',
      pubYear: 2019,
      categoryId: categories['Software Engineering'],
      language: 'English',
      description: 'One of the most significant books on personal programming craftsmanship, continuous learning, and pragmatic system design.',
      totalCopies: 5,
      availableCopies: 4,
      shelfNumber: 'A-11-06',
      coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    },
    {
      title: 'Computer Networking: A Top-Down Approach (8th Edition)',
      author: 'James Kurose, Keith Ross',
      isbn: '978-0136681557',
      publisher: 'Pearson',
      pubYear: 2021,
      categoryId: categories['Computer Science & IT'],
      language: 'English',
      description: 'Focuses on the internet and fundamental principles of networking protocols, layers, security, wireless, and cloud architectures.',
      totalCopies: 6,
      availableCopies: 5,
      shelfNumber: 'C-02-14',
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
    },
    {
      title: 'Linear Algebra and Its Applications (6th Edition)',
      author: 'David C. Lay, Steven R. Lay, Judi J. McDonald',
      isbn: '978-0135851258',
      publisher: 'Pearson',
      pubYear: 2020,
      categoryId: categories['Mathematics & Statistics'],
      language: 'English',
      description: 'Lucid introduction to vectors, matrices, eigenspaces, singular value decomposition, and computational applications.',
      totalCopies: 5,
      availableCopies: 4,
      shelfNumber: 'M-01-08',
      coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
    },
    {
      title: 'Database System Concepts (7th Edition)',
      author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
      isbn: '978-0078022159',
      publisher: 'McGraw-Hill Education',
      pubYear: 2019,
      categoryId: categories['Computer Science & IT'],
      language: 'English',
      description: 'Presents the fundamental concepts of database management, relational algebra, SQL, indexing, transaction processing, and concurrency control.',
      totalCopies: 6,
      availableCopies: 5,
      shelfNumber: 'A-05-10',
      coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
    },
    {
      title: 'Modern Operating Systems (5th Edition)',
      author: 'Andrew S. Tanenbaum, Herbert Bos',
      isbn: '978-0137618880',
      publisher: 'Pearson',
      pubYear: 2023,
      categoryId: categories['Computer Science & IT'],
      language: 'English',
      description: 'Comprehensive coverage of OS fundamentals: processes, memory virtualization, file systems, security, and multi-core scheduling.',
      totalCopies: 4,
      availableCopies: 3,
      shelfNumber: 'C-03-01',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    },
    {
      title: 'The Mythical Man-Month: Essays on Software Engineering',
      author: 'Frederick P. Brooks Jr.',
      isbn: '978-0201835953',
      publisher: 'Addison-Wesley',
      pubYear: 1995,
      categoryId: categories['Business & Management'],
      language: 'English',
      description: 'Few books on software project management have been as influential and timeless as Brooks\' reflections on large-scale team productivity.',
      totalCopies: 3,
      availableCopies: 2,
      shelfNumber: 'B-09-03',
      coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400',
    },
    {
      title: 'Structure and Interpretation of Computer Programs (SICP)',
      author: 'Harold Abelson, Gerald Jay Sussman, Julie Sussman',
      isbn: '978-0262510875',
      publisher: 'The MIT Press',
      pubYear: 1996,
      categoryId: categories['Computer Science & IT'],
      language: 'English',
      description: 'The legendary computing text exploring abstraction, higher-order procedures, state, interpreters, and compilation.',
      totalCopies: 4,
      availableCopies: 4,
      shelfNumber: 'A-01-04',
      coverImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
    },
  ];

  const createdBooks = [];
  for (const b of booksData) {
    const book = await prisma.book.create({ data: b });
    createdBooks.push(book);
  }
  console.log(`✓ ${createdBooks.length} Books created`);

  // 5. Book Transactions & Fines
  const now = new Date();
  const pastDate14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const pastDate28 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const futureDate7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const pastDueDate3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Active transaction 1 - normal issued
  const tx1 = await prisma.bookTransaction.create({
    data: {
      bookId: createdBooks[0].id,
      memberId: studentMember1.id,
      issueDate: pastDate14,
      dueDate: futureDate7,
      status: 'ISSUED',
      issuedById: librarian.id,
      notes: 'Standard academic issue for course CS-402',
    },
  });

  // Active transaction 2 - overdue by 3 days
  const tx2 = await prisma.bookTransaction.create({
    data: {
      bookId: createdBooks[1].id,
      memberId: studentMember1.id,
      issueDate: pastDate28,
      dueDate: pastDueDate3,
      status: 'OVERDUE',
      fineAmount: 3.0,
      issuedById: librarian.id,
      notes: 'Overdue by 3 days ($1/day fine)',
    },
  });

  // Fine for tx2
  await prisma.fine.create({
    data: {
      transactionId: tx2.id,
      memberId: studentMember1.id,
      amount: 3.0,
      status: 'UNPAID',
      notes: 'Late fee for 3 days overdue on CLRS 4th Ed.',
    },
  });

  // Returned transaction 3
  await prisma.bookTransaction.create({
    data: {
      bookId: createdBooks[2].id,
      memberId: studentMember2.id,
      issueDate: pastDate28,
      dueDate: pastDate14,
      returnDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      status: 'RETURNED',
      issuedById: librarian.id,
      returnedById: librarian.id,
      notes: 'Returned in excellent condition.',
    },
  });

  // Active transaction for member 3
  await prisma.bookTransaction.create({
    data: {
      bookId: createdBooks[3].id,
      memberId: studentMember3.id,
      issueDate: pastDate14,
      dueDate: futureDate7,
      status: 'ISSUED',
      issuedById: admin.id,
      notes: 'Faculty special loan authorization',
    },
  });

  // Reservation for member 1 on book 4
  await prisma.reservation.create({
    data: {
      bookId: createdBooks[4].id,
      memberId: studentMember1.id,
      status: 'PENDING',
      notes: 'Needed for final semester capstone project research.',
      expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✓ Transactions, Fines, and Reservations created');

  // 6. Folders for Digital Document Management
  const rootAcademic = await prisma.folder.create({
    data: {
      name: 'Academic Materials',
      category: 'Academic Materials',
      allowedRoles: 'ALL',
      createdById: admin.id,
    },
  });

  const rootResearch = await prisma.folder.create({
    data: {
      name: 'Research Papers',
      category: 'Research Papers',
      allowedRoles: 'ALL',
      createdById: admin.id,
    },
  });

  const rootExams = await prisma.folder.create({
    data: {
      name: 'Question Papers',
      category: 'Question Papers',
      allowedRoles: 'ALL',
      createdById: librarian.id,
    },
  });

  const rootAssignments = await prisma.folder.create({
    data: {
      name: 'Assignments',
      category: 'Assignments',
      allowedRoles: 'ALL',
      createdById: librarian.id,
    },
  });

  const rootEbooks = await prisma.folder.create({
    data: {
      name: 'E-Books',
      category: 'E-Books',
      allowedRoles: 'ALL',
      createdById: librarian.id,
    },
  });

  const rootNotes = await prisma.folder.create({
    data: {
      name: 'Lecture Notes',
      category: 'Notes',
      allowedRoles: 'ALL',
      createdById: admin.id,
    },
  });

  const rootAdminDocs = await prisma.folder.create({
    data: {
      name: 'Administrative Documents',
      category: 'Administrative Documents',
      allowedRoles: 'ADMIN_LIBRARIAN',
      createdById: admin.id,
    },
  });

  // Subfolders
  const subCsNotes = await prisma.folder.create({
    data: {
      name: 'Computer Science Department',
      parentId: rootAcademic.id,
      category: 'Academic Materials',
      allowedRoles: 'ALL',
      createdById: librarian.id,
    },
  });

  const subAiResearch = await prisma.folder.create({
    data: {
      name: 'Artificial Intelligence & Neural Nets',
      parentId: rootResearch.id,
      category: 'Research Papers',
      allowedRoles: 'ALL',
      createdById: admin.id,
    },
  });

  console.log('✓ Digital Folders hierarchy created');

  // 7. Physical files creation in storage directory
  const storageDir = path.join(process.cwd(), 'storage', 'uploads');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // Create real mock academic files so downloads and previews work natively!
  const sampleFiles = [
    {
      name: 'CS401-Distributed-Systems-Syllabus.pdf',
      originalName: 'CS401-Distributed-Systems-Syllabus.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      category: 'Academic Materials',
      folderId: subCsNotes.id,
      allowedRoles: 'ALL',
      description: 'Official academic syllabus, grading rubric, and semester roadmap for CS401 Distributed Systems.',
      content: `%PDF-1.4\n1 0 obj\n<< /Title (CS401 Distributed Systems Syllabus) /Author (University CS Dept) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >>\nendobj\n5 0 obj\n<< /Length 115 >>\nstream\nBT\n/F1 20 Tf\n50 720 Td\n(CS401: Distributed Systems Syllabus - Spring 2026) Tj\n0 -30 Td\n/F1 12 Tf\n(Course covers consensus algorithms, Paxos, Raft, CAP theorem, and MapReduce.) Tj\nET\nendstream\nendobj\n6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 7\n0000000000 65535 f \n0000000009 00000 n \n0000000090 00000 n \n0000000137 00000 n \n0000000196 00000 n \n0000000318 00000 n \n0000000485 00000 n \ntrailer\n<< /Size 7 /Root 2 0 R >>\nstartxref\n555\n%%EOF`,
    },
    {
      name: 'Transformer-Architecture-Attention-Mechanisms.pdf',
      originalName: 'Transformer-Architecture-Attention-Mechanisms.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      category: 'Research Papers',
      folderId: subAiResearch.id,
      allowedRoles: 'ALL',
      description: 'Comprehensive research paper analyzing scaled dot-product attention and multi-head mechanisms in modern LLMs.',
      content: `%PDF-1.4\n1 0 obj\n<< /Title (Transformer Architecture and Attention Mechanisms) /Author (AI Research Lab) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >>\nendobj\n5 0 obj\n<< /Length 128 >>\nstream\nBT\n/F1 18 Tf\n50 720 Td\n(Transformer Architecture & Self-Attention Mechanisms) Tj\n0 -30 Td\n/F1 11 Tf\n(An investigation of multi-head self-attention and positional embeddings in generative models.) Tj\nET\nendstream\nendobj\n6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 7\n0000000000 65535 f \n0000000009 00000 n \n0000000100 00000 n \n0000000147 00000 n \n0000000206 00000 n \n0000000328 00000 n \n0000000508 00000 n \ntrailer\n<< /Size 7 /Root 2 0 R >>\nstartxref\n578\n%%EOF`,
    },
    {
      name: 'Database-Management-Midterm-2025.txt',
      originalName: 'Database-Management-Midterm-2025.txt',
      fileType: 'txt',
      mimeType: 'text/plain',
      category: 'Question Papers',
      folderId: rootExams.id,
      allowedRoles: 'ALL',
      description: 'Previous year examination question paper for Relational Database Systems (CS302).',
      content: `=================================================================\nDEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\nMIDTERM EXAMINATION - SPRING 2025\nCOURSE: CS302 - DATABASE MANAGEMENT SYSTEMS\nTIME: 2 HOURS                                      MAX MARKS: 50\n=================================================================\n\nSECTION A: Answer all questions (5 x 4 = 20 Marks)\n1. Explain ACID properties with real-world banking transaction examples.\n2. Differentiate between B-Tree and B+ Tree indexing structures.\n3. What is Boyce-Codd Normal Form (BCNF)? When does 3NF suffice?\n4. Write SQL queries to find the 2nd highest salary using window functions.\n5. Explain conflict serializability and precedence graphs.\n\nSECTION B: Long Analytical Problems (2 x 15 = 30 Marks)\n6. Consider relation R(A, B, C, D, E) with FDs { A -> B, BC -> D, E -> A }.\n   a) Identify all candidate keys.\n   b) Decompose into 3NF preserving dependencies.\n7. Design an ER diagram for a University Library Circulation Management System.\n=================================================================`,
    },
    {
      name: 'Data-Structures-Assignment-2.docx',
      originalName: 'Data-Structures-Assignment-2.docx',
      fileType: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      category: 'Assignments',
      folderId: rootAssignments.id,
      allowedRoles: 'ALL',
      description: 'Hands-on programming assignment: Red-Black Trees, AVL balance rotations, and Trie dictionary lookup.',
      content: 'PK\x03\x04Assignment: Implement Red-Black Tree insertion, deletion and balance verification.',
    },
    {
      name: 'Library-Audit-Report-2025.xlsx',
      originalName: 'Library-Audit-Report-2025.xlsx',
      fileType: 'xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      category: 'Administrative Documents',
      folderId: rootAdminDocs.id,
      allowedRoles: 'ADMIN_LIBRARIAN',
      description: 'Confidential internal annual inventory audit, asset depreciation, and missing item logs.',
      content: 'PK\x03\x04Library Annual Audit Worksheet 2025-2026. Internal Restricted Circulation Only.',
    },
  ];

  for (const f of sampleFiles) {
    const safeStorageName = `${crypto.randomUUID()}.${f.fileType}`;
    const fullPath = path.join(storageDir, safeStorageName);
    fs.writeFileSync(fullPath, f.content);

    await prisma.digitalFile.create({
      data: {
        name: f.name,
        originalName: f.originalName,
        fileType: f.fileType,
        mimeType: f.mimeType,
        fileSize: Buffer.byteLength(f.content),
        category: f.category,
        description: f.description,
        folderId: f.folderId,
        storagePath: safeStorageName,
        allowedRoles: f.allowedRoles,
        isPublic: f.allowedRoles === 'ALL',
        uploadedById: admin.id,
        downloadCount: Math.floor(Math.random() * 15) + 3,
      },
    });
  }
  console.log(`✓ ${sampleFiles.length} Physical Digital Files created with real storage disk paths`);

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: studentUser1.id,
        title: 'Book Due Reminder',
        message: 'Your borrowed book "Introduction to Algorithms" is overdue by 3 days. Please return it to prevent additional late fees.',
        type: 'WARNING',
        link: '/dashboard/circulation/history',
      },
      {
        userId: studentUser1.id,
        title: 'New Digital Materials Uploaded',
        message: 'New research papers and lecture notes have been added to the Digital Library.',
        type: 'INFO',
        link: '/dashboard/digital-files',
      },
      {
        userId: librarian.id,
        title: 'New Book Reservation Request',
        message: 'Sarah Connor submitted a reservation request for "Deep Learning".',
        type: 'INFO',
        link: '/dashboard/reservations',
      },
      {
        userId: admin.id,
        title: 'System Initialized Successfully',
        message: 'AuraLib Pro Library Management & Digital File Management System configured.',
        type: 'SUCCESS',
        link: '/dashboard',
      },
    ],
  });
  console.log('✓ Notifications created');

  // 9. Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'CREATE',
        entity: 'System',
        entityId: 'Init',
        details: 'System database initialized with default configuration and security rules.',
      },
      {
        userId: librarian.id,
        action: 'ISSUE',
        entity: 'BookTransaction',
        entityId: tx1.id,
        details: 'Issued "Clean Code" to Sarah Connor (Roll: CS-2024-042).',
      },
      {
        userId: librarian.id,
        action: 'UPLOAD',
        entity: 'DigitalFile',
        details: 'Uploaded syllabus and academic documents to Digital Library.',
      },
      {
        userId: admin.id,
        action: 'UPDATE',
        entity: 'Setting',
        details: 'Updated overdue daily fine rate to $1.00/day.',
      },
    ],
  });
  console.log('✓ Activity Logs created');

  console.log('========================================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('========================================================');
  console.log('Demo Credentials:');
  console.log('1. Admin:     admin@library.com     / admin123');
  console.log('2. Librarian: librarian@library.com / librarian123');
  console.log('3. Student:   student@library.com   / student123');
  console.log('========================================================');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
