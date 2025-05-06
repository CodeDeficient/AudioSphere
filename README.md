# AudioSphere

AudioSphere is a web-based music player featuring audio visualization, playlist management, and dynamic track loading. It's built with Next.js, Tone.js for audio processing, and is deployed on Vercel.

## Preview

![AudioSphere Preview](Audiosphere_Preview.png)

## Project Overview

AudioSphere is built with Next.js and leverages modern web technologies to provide a unique audio visualization experience. Key features include:
*   Dynamic playlist management with metadata extraction.
*   Real-time audio spectrum visualization using Tone.js.
*   Playback controls for seamless user experience.
*   File upload and drag-and-drop support for local audio tracks.
*   Deployment on Vercel, with static audio assets served alongside the application.
*   Nix development environment for reproducible builds (via `.idx/dev.nix`).

## Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/CodeDeficient/AudioSphere.git
    cd AudioSphere
    ```
2.  **Install dependencies:**
    Make sure you have Node.js and npm (or yarn/pnpm) installed.
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```
3.  **Set up environment variables (if any):**
    If your deployment or specific features require environment variables, create a `.env.local` file in the root directory and add them there. Refer to `.env.example` if one exists for guidance on required variables.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
    The application should now be running on [http://localhost:3000](http://localhost:3000).

5.  **Using the Nix development shell (Optional but Recommended for consistency):**
    If you have Nix installed, you can enter a consistent development environment by running:
    ```bash
    nix develop .#
    # or if using experimental features without flakes enabled by default
    # nix-shell
    ```
    Inside the Nix shell, all dependencies specified in `.idx/dev.nix` will be available. You can then proceed with `npm install` and `npm run dev`.


## Usage

This project is publicly visible for demonstration and portfolio purposes. The source code is not available for reuse, modification, or distribution without explicit prior permission from the author. All rights are reserved.

---

_This README was updated from a Firebase Studio Next.js starter template._
