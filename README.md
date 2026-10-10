This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Literature review demo storage

The Literature Review workspace uses a server-side JSON file at `data/literature.json` because this project does not currently configure MongoDB or authentication. The API keeps imported OpenAlex metadata separate from user-entered analytical notes and supports the demo user only. The file is created on the first successful import; it should not be treated as production persistence or shared-user data storage. Configure a server-side repository and authentication before deploying the workspace for multiple users.

## Authentication and MongoDB

Signup, login, logout, sessions, and saved-paper ownership require these server-only variables:

```text
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=research_lens
```

Copy `.env.example` to `.env.local` and provide a real MongoDB deployment before using authentication. Passwords are bcrypt-hashed and sessions are stored in MongoDB behind an HttpOnly cookie. The current literature JSON demo remains shared and is not user-scoped; it must be migrated to a user-owned repository before production use.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
