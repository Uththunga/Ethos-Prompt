const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKqJqXqJqXqJqXqJqXqJqXqJqXqJqXqJq",
  authDomain: "rag-prompt-library.firebaseapp.com",
  projectId: "rag-prompt-library",
  storageBucket: "rag-prompt-library.appspot.com",
  messagingSenderId: "743998930129",
  appId: "1:743998930129:web:69dd61394ed81598cd99f0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeMarketplace() {
  try {
    console.log('🚀 Initializing marketplace data...');

    // Create template categories
    const categories = [
      {
        id: 'writing',
        name: 'Writing & Content',
        description: 'Templates for content creation, copywriting, and creative writing',
        icon: '✍️',
        count: 0
      },
      {
        id: 'coding',
        name: 'Code & Development',
        description: 'Programming, debugging, and software development templates',
        icon: '💻',
        count: 0
      },
      {
        id: 'analysis',
        name: 'Data Analysis',
        description: 'Templates for data analysis, research, and insights',
        icon: '📊',
        count: 0
      },
      {
        id: 'business',
        name: 'Business & Strategy',
        description: 'Business planning, strategy, and professional templates',
        icon: '💼',
        count: 0
      },
      {
        id: 'education',
        name: 'Education & Learning',
        description: 'Educational content, tutoring, and learning templates',
        icon: '🎓',
        count: 0
      }
    ];

    console.log('📁 Creating categories...');
    for (const category of categories) {
      await setDoc(doc(db, 'template_categories', category.id), category);
      console.log(`✅ Created category: ${category.name}`);
    }

    // Create sample templates
    const sampleTemplates = [
      {
        title: 'Blog Post Writer',
        description: 'Create engaging blog posts on any topic with proper structure and SEO optimization.',
        content: `Write a comprehensive blog post about {topic}. 

Structure:
1. Compelling headline
2. Introduction that hooks the reader
3. Main content with subheadings
4. Conclusion with call-to-action

Requirements:
- Target audience: {audience}
- Tone: {tone}
- Word count: {word_count}
- Include relevant keywords for SEO

Make it engaging, informative, and actionable.`,
        category: 'writing',
        tags: ['blog', 'content', 'seo', 'writing'],
        author: {
          uid: 'system',
          displayName: 'PromptLibrary Team',
          email: 'team@promptlibrary.com',
          verified: true,
          rating: 5.0,
          totalTemplates: 10
        },
        isPublic: true,
        isPremium: false,
        downloads: 1250,
        likes: 89,
        views: 3420,
        rating: 4.8,
        ratingCount: 156,
        ratings: [],
        variables: [
          { name: 'topic', type: 'string', description: 'The main topic of the blog post', required: true },
          { name: 'audience', type: 'string', description: 'Target audience', required: true },
          { name: 'tone', type: 'string', description: 'Writing tone (professional, casual, etc.)', required: false, default: 'professional' },
          { name: 'word_count', type: 'number', description: 'Desired word count', required: false, default: '800' }
        ],
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date()
      },
      {
        title: 'Code Review Assistant',
        description: 'Comprehensive code review template for identifying bugs, improvements, and best practices.',
        content: `Review the following code and provide detailed feedback:

\`\`\`{language}
{code}
\`\`\`

Please analyze:
1. **Code Quality**: Structure, readability, and maintainability
2. **Performance**: Potential optimizations and bottlenecks
3. **Security**: Vulnerabilities and security best practices
4. **Best Practices**: Language-specific conventions and patterns
5. **Bugs**: Potential issues and edge cases

Provide specific suggestions for improvement with examples where applicable.`,
        category: 'coding',
        tags: ['code-review', 'debugging', 'best-practices', 'programming'],
        author: {
          uid: 'system',
          displayName: 'PromptLibrary Team',
          email: 'team@promptlibrary.com',
          verified: true,
          rating: 5.0,
          totalTemplates: 10
        },
        isPublic: true,
        isPremium: false,
        downloads: 890,
        likes: 67,
        views: 2100,
        rating: 4.7,
        ratingCount: 89,
        ratings: [],
        variables: [
          { name: 'language', type: 'string', description: 'Programming language', required: true },
          { name: 'code', type: 'text', description: 'Code to review', required: true }
        ],
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date()
      },
      {
        title: 'Data Analysis Report',
        description: 'Generate comprehensive data analysis reports with insights and recommendations.',
        content: `Analyze the following dataset and create a comprehensive report:

**Dataset**: {dataset_description}
**Analysis Goal**: {analysis_goal}

Please provide:

1. **Executive Summary**
   - Key findings and insights
   - Main recommendations

2. **Data Overview**
   - Dataset characteristics
   - Data quality assessment

3. **Analysis Results**
   - Statistical findings
   - Trends and patterns
   - Correlations and relationships

4. **Visualizations Recommended**
   - Suggested charts and graphs
   - Key metrics to highlight

5. **Conclusions & Recommendations**
   - Actionable insights
   - Next steps

Format the report professionally with clear sections and bullet points.`,
        category: 'analysis',
        tags: ['data-analysis', 'reporting', 'insights', 'statistics'],
        author: {
          uid: 'system',
          displayName: 'PromptLibrary Team',
          email: 'team@promptlibrary.com',
          verified: true,
          rating: 5.0,
          totalTemplates: 10
        },
        isPublic: true,
        isPremium: true,
        price: 9.99,
        downloads: 456,
        likes: 34,
        views: 1200,
        rating: 4.9,
        ratingCount: 45,
        ratings: [],
        variables: [
          { name: 'dataset_description', type: 'text', description: 'Description of the dataset', required: true },
          { name: 'analysis_goal', type: 'string', description: 'What you want to achieve with the analysis', required: true }
        ],
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date()
      }
    ];

    console.log('📝 Creating sample templates...');
    for (const template of sampleTemplates) {
      const docRef = await addDoc(collection(db, 'marketplace_templates'), template);
      console.log(`✅ Created template: ${template.title} (ID: ${docRef.id})`);
    }

    console.log('🎉 Marketplace initialization complete!');
    console.log('📊 Summary:');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Templates: ${sampleTemplates.length}`);
    console.log('');
    console.log('🌐 Visit https://rag-prompt-library.web.app/marketplace to see the results!');

  } catch (error) {
    console.error('❌ Error initializing marketplace:', error);
  }
}

// Run the initialization
initializeMarketplace();
