// Setup script for local development
// Run with: node scripts/setup-local.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 OrgChart Local Setup Helper\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local from .env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Modify for local development
    const localEnvContent = envContent
      .replace('postgresql://username:password@localhost:5432/orgchart_db', 
               'postgresql://postgres:localpassword@localhost:5432/orgchart_local')
      .replace('pk_test_...', 'pk_test_YOUR_CLERK_DEV_KEY')
      .replace('sk_test_...', 'sk_test_YOUR_CLERK_DEV_SECRET')
      .replace('sk-...', 'sk-YOUR_OPENAI_KEY');
    
    fs.writeFileSync(envPath, localEnvContent);
    console.log('✅ .env.local created! Please update with your actual keys.\n');
  }
} else {
  console.log('✅ .env.local already exists\n');
}

// Create sample data files
const samplesDir = path.join(__dirname, '..', 'sample-data');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir);
}

// Create test CSV
const testCsvPath = path.join(samplesDir, 'test-employees.csv');
if (!fs.existsSync(testCsvPath)) {
  console.log('📊 Creating test-employees.csv...');
  
  const csvContent = `employeeId,firstName,lastName,email,title,department,managerId,personalityType,systemMessage
100,Alice,Johnson,alice@test.local,CEO,Executive,0,professional,"I focus on company vision and strategic initiatives"
101,Bob,Smith,bob@test.local,CTO,Technology,100,technical,"I oversee all technology initiatives and engineering teams"
102,Carol,Williams,carol@test.local,VP Engineering,Engineering,101,analytical,"I manage the engineering department and technical architecture"
103,David,Brown,david@test.local,Senior Engineer,Engineering,102,technical,"I work on backend systems and API development"
104,Emma,Davis,emma@test.local,Frontend Lead,Engineering,102,creative,"I lead the frontend team and UX initiatives"
105,Frank,Miller,frank@test.local,CFO,Finance,100,analytical,"I manage company finances and investor relations"
106,Grace,Wilson,grace@test.local,VP Sales,Sales,100,friendly,"I lead the sales team and customer relationships"
107,Henry,Moore,henry@test.local,Sales Manager,Sales,106,supportive,"I manage the sales team and help close deals"
108,Iris,Taylor,iris@test.local,HR Director,Human Resources,100,supportive,"I handle recruiting and employee wellbeing"
109,Jack,Anderson,jack@test.local,Product Manager,Product,101,mentor,"I manage product roadmap and feature prioritization"`;

  fs.writeFileSync(testCsvPath, csvContent);
  console.log('✅ Test CSV created at sample-data/test-employees.csv\n');
} else {
  console.log('✅ Test CSV already exists\n');
}

// Create sample documents
const docsToCreate = [
  {
    filename: 'alice-ceo-context.md',
    content: `# Alice Johnson - CEO

## Background
Alice founded the company in 2020 with a vision to revolutionize organizational communication through AI. She has 15 years of experience in enterprise software and previously served as VP of Product at TechCorp.

## Current Responsibilities
- Setting company vision and strategy
- Board management and investor relations
- Key customer relationships
- Team culture and values

## Q4 2024 Priorities
1. Series B fundraising ($30M target)
2. International expansion (EU and APAC)
3. Enterprise product launch
4. Growing team from 50 to 100 employees

## Areas of Expertise
- Enterprise SaaS
- Go-to-market strategy
- Fundraising and investor relations
- Team building and culture
- Product vision

## Communication Style
Professional but approachable. Values transparency and direct communication. Always happy to discuss company vision and strategic initiatives with team members.`
  },
  {
    filename: 'bob-cto-context.txt',
    content: `Bob Smith - CTO Technical Profile

TECHNICAL STACK:
- Backend: Node.js, Python, Go
- Frontend: React, Next.js, TypeScript
- Database: PostgreSQL, Redis, MongoDB
- Cloud: AWS, Vercel, Docker, Kubernetes
- AI/ML: OpenAI, LangChain, Vector DBs

CURRENT PROJECTS:
1. AI Assistant Platform - Leading the development of our core AI chat system
2. Scalability Initiative - Preparing infrastructure for 10x growth
3. Security Audit - SOC 2 compliance preparation
4. Tech Debt Reduction - Modernizing legacy systems

TEAM STRUCTURE:
- Direct Reports: 3 VP/Directors
- Total Team Size: 25 engineers
- Split: 60% Backend, 30% Frontend, 10% DevOps

TECHNICAL PHILOSOPHY:
- Build for scale from day one
- Prioritize developer experience
- Embrace boring technology where possible
- Fast iteration with strong testing

AVAILABILITY:
- 1:1s with directs: Mondays
- Architecture reviews: Wednesdays
- Open office hours: Friday afternoons
- Prefers Slack for quick questions, email for detailed discussions`
  },
  {
    filename: 'emma-frontend-context.md',
    content: `# Emma Davis - Frontend Lead

## Role Overview
Leading a team of 5 frontend engineers building our React-based applications. Focus on creating delightful user experiences while maintaining high code quality and performance standards.

## Current Initiatives

### Design System 2.0
Building a comprehensive component library with:
- 50+ reusable components
- Full accessibility compliance (WCAG 2.1 AA)
- Dark mode support
- Storybook documentation

### Performance Optimization
- Achieved 95+ Lighthouse scores across all pages
- Reduced bundle size by 40% through code splitting
- Implemented progressive enhancement strategies

### Team Development
- Running weekly frontend guild meetings
- Mentoring 2 junior developers
- Leading technical interview process for frontend roles

## Technical Expertise
- **Languages**: TypeScript, JavaScript, CSS, HTML
- **Frameworks**: React, Next.js, Vue.js
- **Testing**: Jest, React Testing Library, Cypress
- **Tools**: Webpack, Vite, Figma, Storybook
- **Performance**: Web Vitals, Bundle analysis, CDN optimization

## Working Style
- Advocates for user-centric design
- Strong believer in automated testing
- Enjoys pair programming and code reviews
- Available for design reviews and UX discussions`
  }
];

docsToCreate.forEach(doc => {
  const docPath = path.join(samplesDir, doc.filename);
  if (!fs.existsSync(docPath)) {
    console.log(`📄 Creating ${doc.filename}...`);
    fs.writeFileSync(docPath, doc.content);
    console.log(`✅ ${doc.filename} created\n`);
  }
});

console.log('\n🎉 Setup complete!\n');
console.log('Next steps:');
console.log('1. Update .env.local with your actual API keys');
console.log('2. Set up your local PostgreSQL database');
console.log('3. Run: npm run db:push');
console.log('4. Run: npm run dev');
console.log('5. Sign up and make yourself admin');
console.log('6. Upload sample-data/test-employees.csv');
console.log('7. Attach documents from sample-data/ to employees');
console.log('\nHappy testing! 🚀');