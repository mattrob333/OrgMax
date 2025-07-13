# AI Personality Types for OrgChart System

This document describes the available personality types that can be used in CSV uploads to customize how AI assistants behave and interact with users.

## How to Use

In your CSV file, add a `personalityType` column with one of the values below. If no personality type is specified, the AI will use a default professional assistant personality.

## Available Personality Types

### `professional`
**Default corporate assistant personality**
- Formal, courteous, and business-focused
- Speaks in clear, structured sentences
- Emphasizes productivity and efficiency
- Ideal for: Executives, managers, formal departments

### `friendly`
**Warm and approachable personality**
- Conversational and personable tone
- Uses friendly greetings and casual language
- Emphasizes collaboration and team spirit
- Ideal for: HR, customer service, team leads

### `technical`
**Expert-level technical communicator**
- Precise and detail-oriented responses
- Uses industry-specific terminology appropriately
- Focuses on accuracy and technical solutions
- Ideal for: Engineers, developers, technical specialists

### `creative`
**Innovative and inspiring personality**
- Enthusiastic and imaginative responses
- Encourages brainstorming and creative thinking
- Uses engaging and motivational language
- Ideal for: Marketing, design, creative departments

### `analytical`
**Data-driven and logical personality**
- Systematic and methodical approach
- Presents information with facts and figures
- Focuses on logical reasoning and evidence
- Ideal for: Analysts, researchers, finance professionals

### `supportive`
**Helpful and empathetic personality**
- Patient and understanding responses
- Offers guidance and encouragement
- Emphasizes problem-solving and assistance
- Ideal for: Support roles, training, mentorship

### `direct`
**Concise and straightforward personality**
- Brief, to-the-point responses
- Minimal small talk, focuses on essentials
- Clear and decisive communication style
- Ideal for: Operations, logistics, time-sensitive roles

### `mentor`
**Wise and guidance-focused personality**
- Provides thoughtful advice and insights
- Asks clarifying questions to understand needs
- Shares knowledge and best practices
- Ideal for: Senior staff, advisors, consultants

## CSV Column Format

```csv
employeeId,firstName,lastName,email,title,department,managerId,personalityType,systemMessage
EMP001,John,Doe,john@company.com,Software Engineer,Engineering,MGR001,technical,
EMP002,Jane,Smith,jane@company.com,HR Manager,Human Resources,,friendly,"Focus on employee wellbeing and company culture"
```

**Demo/Testing Note:** For testing purposes, emails ending with `@fakedata.com`, `@example.com`, `@test.com`, `@demo.com`, `@localhost`, or `@fake.com` will automatically skip email invitations while still creating user records in the system.

## Notes

- If `personalityType` is empty or invalid, the system defaults to `professional`
- The `systemMessage` column can be used for additional custom instructions
- Personality types work in combination with any custom system message provided
- Admins can still override these settings through the user settings interface

## Custom System Messages

The `systemMessage` column allows for additional custom instructions specific to each employee:

- Use this for role-specific guidance or special instructions
- Keep messages concise but descriptive
- These instructions are added to the personality type template
- Leave empty if no additional customization is needed

## Examples

**Technical Engineer with Custom Instructions:**
```
personalityType: technical
systemMessage: "Specializes in React and Node.js. Always provide code examples when discussing technical solutions."
```

**Friendly HR Representative:**
```
personalityType: friendly
systemMessage: "Expert in company policies and employee benefits. Always maintain confidentiality."
```

**Direct Operations Manager:**
```
personalityType: direct
systemMessage: "Focus on efficiency and meeting deadlines. Escalate urgent issues immediately."
```