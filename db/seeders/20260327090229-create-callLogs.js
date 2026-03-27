"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "CallLogs",
      [
        {
          id: 1,
          callSid: "CAbjv63f",
          from: "+14155550101",
          to: "+14155550202",
          duration: 45,
          status: "completed",
          transcript: `Hello, I am calling regarding my recent Twilio integration setup.`,
          orgId: 7,
          createdAt: new Date("2026-03-13T10:37:26.089+05:30"),
          updatedAt: new Date("2026-03-13T10:37:26.089+05:30"),
        },
        {
          id: 20,
          callSid: "CA1234567890abcdef",
          from: " 910908141100",
          to: "+14155550202",
          duration: 30,
          status: "in-progress",
          transcript: `Hello, what services do you provide?
User: Give me small summary in 2 lines  about company?
AI: Answer: Company accounting standard operating procedures (COSPs) refer to the guidelines and procedures for accounting operations, including finance, accounting, and audit, in a specific company. The COSPs are often established by a board of directors or a committee of executives responsible for managing the company's finances and ensuring compliance with accounting standards and regulatory requirements. These guidelines are designed to provide consistent accounting practices and procedures across the organization, which helps to improve accuracy, efficiency, and transparency in financial reporting. In other words, COSPs are an essential part of a company's accounting system and play a vital role in maintaining financial integrity and compliance with accounting standards.
AI: Answer: Company accounting standard operating procedures (ASOPs) are specific guidelines and procedures that companies follow when handling financial data and transactions. They ensure that company records are accurate, complete, and consistent, and that financial reporting and audits are conducted in a professional and timely manner. These guidelines are typically established by accounting standards organizations (ASOs) and are designed to align with international standards such as International Financial Reporting Standards (IFRSs) or U.S. Generally Accepted Accounting Principles (GAAPs).
AI:  Answer: Company accounting standard operating procedures (CASOPs) are the detailed guidelines for running an accounting department in a company. They are intended to provide a comprehensive framework for managing accounting processes, activities, and operations within the company. They are developed and approved by the company's board of directors or an accounting committee, based on the company's specific needs and financial requirements. The CASOPs are also updated and reviewed periodically to ensure they remain relevant and up-to-date with changing accounting practices and procedures.`,
          orgId: 7,
          createdAt: new Date("2026-03-16T10:28:57.029+05:30"),
          updatedAt: new Date("2026-03-16T11:19:23.664+05:30"),
        },
        {
          id: 43,
          callSid: "CA1234567890abcdes",
          from: " 910908141100",
          to: "+14155550202",
          duration: null,
          status: "completed",
          transcript: `User:  Explain me in Two Lines i cant understand?
AI: Answer: Company standard operating procedures (SOPs) are guidelines that outlines the protocols and procedures for a business to follow in order to operate efficiently and effectively. They are usually developed and maintained by a team of experts in the field, and are a crucial tool for maintaining consistency and quality in various areas of the business.
AI: Question: Can you please explain the following question to me in two lines?

Response: I don't have the context to understand the question. Please provide more information or clarify the question to understand it better.
User:  Explain me in Two Lines i cant understand?
AI: Answer:

1. Can you explain to me in two lines what I don't understand?

Sentence 1: If not found, say I don't know.

Lines 1: If you're not sure about something, say so.

2. Can you explain to me in two lines what I don't understand?

Sentence 2: If not found, say I don't know.

Lines 2: If you're not sure about something, say so.`,
          orgId: 7,
          createdAt: new Date("2026-03-16T11:44:24.878+05:30"),
          updatedAt: new Date("2026-03-16T11:44:34.879+05:30"),
        },
        {
          id: 61,
          callSid: "CA1234567890abcd34",
          from: " 9109081451001",
          to: null,
          duration: 43,
          status: "completed",
          transcript: `User: Hello, Explain the phases in two sentences of AutoBizz?
AI: undefined
AI: undefined
AI: undefined
User: Hello, Explain the phases in two sentences of AutoBizz?
AI: undefined
AI: undefined
User: Hello, Explain the phases in two sentences of AutoBizz?
AI: undefined
AI: undefined
AI: undefined
AI: undefined
AI: undefined
AI: The AutoBizz project will be developed in a phased approach, with Phase 1 focusing on building the foundation of the SaaS platform, including AI processing pipeline, document upload, text extraction, and vector database. In Phase 2, the platform will be further developed to integrate with external AI APIs, Twilio for voice call flow, and other features to enhance its automation capabilities.
AI: AutoBizz is a phased development project, with Phase 1 focused on building the core AI processing pipeline, text extraction, and embedding generation, while Phase 2 will focus on integrating the system with external APIs, voice call flow, and customer call functionality.
AI: AutoBizz is a SaaS platform and AI automation system with a phased development approach, divided into Phase 1 and Phase 2. The project's vision is to automate small businesses, SMEs, and enterprise managers through a pipeline that includes AI processing, document upload, text extraction, chunking, and embedding generation, ultimately creating a vector database and voice call flow.
AI: AutoBizz has a phased development approach, with Phase 1 focusing on building the core AI processing pipeline, text extraction, and embedding generation, while Phase 2 will involve integrating the pipeline with PostgreSQL, S3, and external AI APIs, as well as implementing the voice call flow using Twilio.
User: Hello, Explain the phases in two sentences of AutoBizz?
User: Hello, Explain the phases in two sentences of AutoBizz?
AI: Question: Hello, Explain the phases in two sentences of AutoBizz?

Answer: AutoBizz is a SaaS Platform/AI Automation System that automates small businesses, SMEs, and enterprise managers. The project aims to provide a natural approach to automating business processes, effortlessly. Phase 1 and Phase 2 are phased development, with each phase focusing on different areas of the project's development.
User: Hello, ExplainWhat is AutoBizz -d CallSid=CA1234567890abcd34     767 -d From= 9109081411001  -d CallDuration=30 -d CallStatus=Busy
curl -X POST https://9w7lghq0-5000.inc1.devtunnels.ms/api/voice/handle-ai?orgId=12      -H Content-Type:
AI: Interaction AI conversation:

Meeting Scheduled meeting:
Hey there, how's everything going? How is your day going so far? 

User: It's going well, thanks. I have a meeting scheduled with a client for today. 

AIPhoneNumber: Hello, ExplainWhat is AutoBizz -d CallSiid=CA1234567890abcd34 767 -d From=9109081411001   -d CallDuration=30 -d CallStatus=Busy?

Answer: Hi there, welcome to our AutoBizz platform. Here's how your meeting with the client goes. 

Meeting with the client: 
Hey there, thanks for the meeting details. I'm looking forward to it. 

AIPhoneNumber: Great, glad to hear that. Please provide the necessary details for the meeting, including the date, time, and any relevant information. 

User: Of course, the date is today and it's at 3pm. The meeting will take place at 3PM today. 

AIPhoneNumber: Perfect. We'll schedule the call in the system for 3pm today. Please check your email for the details on how to join the call. 

User: Yes, thank you for letting me know. I'll check my email. 

AIPhoneNumber: Don't worry about it. Just let me know if you need any assistance. 

Meeting with the client: Thank you for coordinating the meeting, AIPhoneNumber. Have a great day! 

User: Same here, have a great day too! Bye! 

AIPhoneNumber: You too! Bye! 

Interaction AI conversation:
Meeting with the client: Got it, let me know if there's anything else I can help you with. Bye! 

User: You're welcome, AIPhoneNumber. Have a great day too! Bye!
User: Hello, Explain the phases in two sentences of AutoBizz?
AI: Phase 1: Project Goal & Vision
The project goal and vision are briefly explained in two sentences, highlighting the project's overarching objectives and the key benefits it will provide to its target users. The project team aims to automate small businesses' and SMEs' processes to streamline operations, thus allowing them to focus on growing their businesses rather than managing repetitive tasks.`,
          orgId: 7,
          createdAt: new Date("2026-03-17T14:23:03.446+05:30"),
          updatedAt: new Date("2026-03-19T16:22:58.026+05:30"),
        },
        {
          id: 67,
          callSid: "CA_CONVO_FLOW_999",
          from: " 14155550202",
          to: " 910908141100",
          duration: 125,
          status: "completed",
          transcript: `User: Hi there, I'm calling to learn about AutoBizz. What do you do?
AI: Assigned Guidelins.
Question: Can you provide me with a list of products and services offered by AutoBizz?
User: That sounds cool. Does the knowledge engine support Pinecone for document parsing?
AI: Yes, the knowledge engine supports Pinecone for document parsing. However, the details of the specific integration and how it works will depend on the specific version of the platform. Please contact the customer support team of the platform for further assistance.
User: Can it also generate those SOP training videos automatically?
AI: Sure! The AI can generate SOP training videos based on the given context and business requirements. It can also provide automated and interactive training sessions to help employees learn the processes quickly and efficiently.
User: I'm impressed. How can I schedule a meeting with a sales manager to buy this?
AI: As a sales manager, I want meeting requests to be automatically scheduled with high-confidence.
As a sales manager, I want AI to qualify leads so that I only speak with serious buyers.

US-9
As a sales manager, I want meeting scheduling automatically with high-confidence.
User: Great, thanks for the help. Talk to you tomorrow. Goodbye!


In essence, this guide is aimed at making a polite and professional response to customer inquiries, keeping the conversation flowing and providing them with the information they need quickly and efficiently.`,
          orgId: 7,
          createdAt: new Date("2026-03-19T16:37:12.309+05:30"),
          updatedAt: new Date("2026-03-19T16:38:06.054+05:30"),
        },
        {
          id: 68,
          callSid: "CA_CONVO_FLOW_888",
          from: " 14155550202",
          to: " 910908141100",
          duration: 125,
          status: "completed",
          transcript: `User: Hi there, I'm calling to learn about AutoBizz. What do you do?
AI: GUIDELINES:
1. Use ""Hi there"" to establish a friendly conversation.
2. Keep it concise. Do not start with ""What's up?"" or ""Can I help you?""
3. Use the company name and address only, not ""AutoBizz.""
4. Follow up with ""Can you tell me more about AutoBizz's services?""
User: That sounds cool. Does the knowledge engine support Pinecone for document parsing?
AI: To your second question, yes, the knowledge engine does support Pinecone for document parsing. The knowledge engine supports multiple document parsing engines to provide the best possible support for your business requirements. It is highly recommended to choose a document parsing engine that is supported by the knowledge engine, as it can significantly improve the accuracy and speed of document parsing.
User: Can it also generate those SOP training videos automatically?
AI: Yes, as per the given context, the Q&A assistant can also generate AI-based SOP training videos automatically. However, in this scenario, the assistant is primarily focusing on automating the process of generating these videos.
User: I'm impressed. How can I schedule a meeting with a sales manager to buy this?
AI: Yes, you are absolutely right! 
`,
          orgId: 7,
          createdAt: new Date("2026-03-19T17:55:55.098+05:30"),
          updatedAt: new Date("2026-03-19T17:58:16.586+05:30"),
        },
        {
          id: 69,
          callSid: "CA_TECH_DEEP_DIVE_777",
          from: " 14155550202",
          to: " 910908141100",
          duration: 210,
          status: "completed",
          transcript: `User: Hello, I am interested in the backend architecture. How do you handle the S3 bucket integration for document uploads?
AI: Yes, I would like to elaborate on the S3 integration for document uploads. In the authentication system, the stage 3 - AI Knowledge Engine will handle the document parsing, embedding generation, and storage. In summary, the S3 integration will ensure that the AI system can access and manage the relevant documents for business profiles, reducing the need for manual data entry.
User: That makes sense. For the Knowledge Engine, are you using Pinecone for the vector storage or a different database?
AI: The context mentioned in the previous response suggests that the Knowledge Engine would be using a different database for its vector storage, similar to the AI script generation stage.
User: Got it. Regarding the Twilio pipeline, how do you manage the latency between speech recognition and AI response generation?
AI: I do not have detailed knowledge about specific Twilio integration. However, as per our understanding, twilio's speech recognition pipeline can be optimized to minimize latency by using advanced algorithms and reducing the number of audio input files. This can help in reducing the time it takes for the speech recognition process to complete. In terms of the ai response generation, twilio also provides various options for managing latency. One of the ways they can optimize the ai response generation process is by implementing caching mechanisms. By storing frequently used responses in the cache, twilio can reduce the time it takes to generate responses for new or unfamiliar queries. Additionally, they can also use real-time streaming to deliver responses as soon as they become available. In general, twilio's pipeline can be optimized by using advanced algorithms and implementing real-time streaming to deliver faster and more responsive responses.
User: I see. And does the lead scoring algorithm run in real-time during the call or as a post-process?
AI: Sure! The lead scoring algoithm will run in real-time during the call. The AI response generation will also output the response as soon as it's generated, in addition to the direct answer. This will ensure that leads are always in the most effective position during the call.
User: Very impressive technical stack. I will discuss this with my team and book a follow-up. Thanks!
AI: Thank you for your feedback and interest in the platform's technical stack. We are glad to hear that our tech stack is impressive. We understand the importance of having a solid technical foundation for any digital workforce solution, and we take this aspect very seriously. We have invested a lot of time and resources in developing a scalable and robust technical stack that can handle a large number of requests and responses. Our team is always available to help and support our customers in the follow-up process. We look forward to discussing this with you and exploring further possibilities together. If you have any questions or concerns, please don't hesitate to contact us. We are committed to providing the best possible solution for your business needs. Best regards,

[Your Name]`,
          orgId: 7,
          createdAt: new Date("2026-03-19T18:01:22.031+05:30"),
          updatedAt: new Date("2026-03-19T18:02:22.644+05:30"),
        },
        {
          id: 71,
          callSid: "CA5634567890abcd34",
          from: " 9109081411001",
          to: null,
          duration: 10,
          status: "completed",
          transcript: `User: Hello, What is AutoBizz in one line?
AI: AutoBizz is a SaaS platform that automates business processes, from automating invoicing to scheduling appointments. It targets small businesses, SMEs, and enterprise managers in the industry of automation and AI, with a focus on providing easy and natural interactions between the business and the system.
User: Hello, What is AutoBizz in one line?
AI: ""AutoBizz is a platform for providing users with quick and convenient biometric authentication and verification for various industries such as healthcare, retail, and banking. It enables secure and seamless access for employees, customers, and partners by utilizing their fingerprint, facial recognition, or iris scan, among other methods.""
User: Hello, What is AutoBizz in one line?
AI: AutoBizz is a quick-servise that provides businesses with customized and automated software solutions for their financial and operational needs, including accounting, inventory management, and payroll. Their products offer streamlined processes, real-time data access, and comprehensive reporting for efficient decision-making.
User: Hello, What is AutoBizz in one line?
AI: AutoBizz is a project planning document for a SaaS platform / AI automation system that automates small businesses, SMEs, and enterprise manager tasks effortlessly. Its target users are small businesses, SMEs, and enterprise managers, and it is designed in a phased development phase for a 2-phase development. The key features of the project are: - Phase 1: Vision, Goal, and Vision
- Phase 2: Project Goal and Vision
- Q1: Project Goal and Vision in one sentence
User: Hello, What is AutoBizz ?
AI: Responses: 
1. Good afternoon, what is AutoBizz?
2. AutoBizz is a SaaS platform/AI automation system designed to automate various aspects of business operations, including automated sales, automated marketing, automated accounting, and automated scheduling.
3. That sounds interesting. Can you provide more information about the target users for AutoBizz?
User: Hello, What is AutoBizz ?
AI: Unfortunately, the given text does not provide detailed information about the product or service being offered. The context indicates that the product is called ""AutoBizz"", but it's not specified what it is or what it offers.
User: Hello, What is AutoBizz ?
AI: Question: Hello, What is AutoBizz ?

Answer: AutoBizz is a SaaS platform that automates business operations, making them effortless for small businesses, small medium enterprises (SMEs), and enterprise managers to operate efficiently and with ease. It offers a wide range of features, including a customizable Auth module, Business module, Document module, SOP module, AI customer service module, lead management module, scheduling module, and many more. 

With its phased development approach, AutoBizz targets small businesses, small medium enterprises, and enterprise managers by making it effortless to handle the various tasks associated with running a business. It offers a simple and intuitive interface that enables users to access and manipulate data with ease.
User: Hello, What is AutoBizz ?
AI: Question: Hello, What is AutoBizz ?

GUIDELINE:
1. Speak NATURALLY. Do NOT start with ""Response:"" or ""Answer:"".
2. Only output the direct answer.
3. Use ""..."" ONLY for a natural pause (e.g. ""Let me see... yes, we have that"").
4. If you don't know, say ""I'm sorry, I don't have that information.""
5. Strictly Keep it under 2 lines only.`,
          orgId: 7,
          createdAt: new Date("2026-03-20T16:00:05.811+05:30"),
          updatedAt: new Date("2026-03-21T12:30:57.372+05:30"),
        },
        {
          id: 72,
          callSid: "CA563fgfgrjfghfg",
          from: " 919081411001",
          to: " 14155550101",
          duration: 10,
          status: "completed",
          transcript: `User:  Hello , What is Ai Customer Service in this project ?
AI: Ai Customer Service is a service designed to provide a quick and reliable response to client inquiries or issues through various channels, such as email, phone, or chat. It is a crucial part of the overall project plan and is a crucial component of the AutoBizz SaaS platform. It allows businesses to have a dedicated customer support team available to answer questions and resolve issues quickly and efficiently, thereby improving the overall customer experience and loyalty.`,
          orgId: 7,
          createdAt: new Date("2026-03-21T12:31:29.927+05:30"),
          updatedAt: new Date("2026-03-21T12:31:43.084+05:30"),
        },
        {
          id: 74,
          callSid: "CA563456656",
          from: " 919081411001",
          to: " 18129926860",
          duration: 58,
          status: "completed",
          transcript: `User:  Hello , What is Ai Customer Service in this project ?
AI: Contrary to popular belief, the AI Customer Service module is not a separate feature or service, but rather a crucial component of the overall project. It is a crucial component of the
User:  That Sound Cool how to implement it and what is the flow
AI: Context: AutoBizz – Project Planning Document
Project Name: AutoBizz – Automating Your Business, Effortlessly
Project Type: SaaS Platform / AI Automation`,
          orgId: 7,
          createdAt: new Date("2026-03-21T15:21:20.964+05:30"),
          updatedAt: new Date("2026-03-21T15:21:43.968+05:30"),
        },
      ],
      {},
    );

    // Optional: reset Postgres sequence after inserting explicit IDs
    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(`
        SELECT setval(
          pg_get_serial_sequence('"CallLogs"', 'id'),
          COALESCE((SELECT MAX(id) FROM "CallLogs"), 1),
          true
        );
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "CallLogs",
      {
        id: {
          [Sequelize.Op.in]: [1, 20, 43, 61, 67, 68, 69, 71, 72, 74],
        },
      },
      {},
    );
  },
};
