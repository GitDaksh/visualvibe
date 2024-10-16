# VisualVibe

**VisualVibe** is a modern video conferencing web application built using Next.js and TypeScript, designed to provide seamless virtual meetings with real-time video conferencing features. The app is powered by Clerk for user authorization and management, and utilizes Stream's API for handling video conferencing functionalities.

## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Setup Instructions](#setup-instructions)
4. [Usage](#usage)
5. [Folder Structure](#folder-structure)
6. [API Reference](#api-reference)
7. [Contributing](#contributing)
8. [License](#license)

---

## Features

- **Real-Time Video Conferencing**: Utilize Stream's API to deliver high-quality video conferencing.
- **User Authentication & Management**: Secure authentication powered by Clerk.
- **Responsive UI**: Built with React components to ensure smooth user experiences across all devices.
- **Type Safety**: Entire project is built using TypeScript for enhanced type safety and maintainability.
- **Easy Integration**: Scalable and modular architecture, making it easy to add new features.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: TypeScript (`.tsx`)
- **Authentication**: [Clerk](https://clerk.dev/)
- **Video Conferencing**: [Stream API](https://getstream.io/)
- **Styling**: Tailwind CSS (or mention any other if used)
- **Deployment**: Vercel (if deployed, adjust if using a different service)

---

## Setup Instructions

To get started with **VisualVibe**, follow the instructions below:

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or above)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) package manager
- [Clerk account](https://clerk.dev/) for authentication
- [Stream API account](https://getstream.io/) for video conferencing

---

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/GitDaksh/VisualVibe.git
    cd VisualVibe
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:

    Create a `.env.local` file in the root directory and add the following:

    ```bash
    NEXT_PUBLIC_CLERK_FRONTEND_API=<Your_Clerk_Frontend_API>
    CLERK_API_KEY=<Your_Clerk_Backend_API_Key>
    STREAM_API_KEY=<Your_Stream_API_Key>
    ```

4. Run the development server:

    ```bash
    npm run dev
    ```

    The app should now be running at `http://localhost:3000`.

---

## Usage

### Authentication
- **Sign Up/Sign In**: VisualVibe uses Clerk to handle sign-ups and sign-ins. Users need to create an account to join or host video calls.

### Video Conferencing
- **Start/Join a Meeting**: Users can initiate or join meetings using the Stream API’s video conferencing features.
- **UI Components**: The UI includes components for creating and managing meetings, chatting, and more.
  
---


## API Reference

### Authentication (Clerk)

- **Sign Up**: Redirects users to a sign-up page managed by Clerk.
- **Sign In**: Clerk handles the sign-in process securely.

### Video Conferencing (Stream API)

- **Create Room**: Uses Stream API to create a video conferencing room.
- **Join Room**: Allows users to join a room using a room ID.
- **Chat**: Real-time chat functionality is included in every video call.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/feature-name`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/feature-name`).
5. Create a pull request.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.dev/)
- [Stream API](https://getstream.io/)

---
