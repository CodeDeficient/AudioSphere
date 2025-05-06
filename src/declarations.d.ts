declare module 'butterchurn' {
    // Declare the parts of the module you are using
    export function createVisualizer(audioContext: AudioContext, canvas: HTMLCanvasElement, options: any): Visualizer;

    // Declare a placeholder for the Visualizer type if it's used as a type annotation
    export interface Visualizer {
        connectAudio(node: any): void; // Changed parameter type to any
        loadPreset(preset: object, blendTime: number): void;
        render(): void;
        // Add other methods/properties you use from the Visualizer instance
    }

    // If there are other top-level exports you use, declare them here.
    // For example, if there's a default export:
    // export default any;
}

declare module 'butterchurn-presets' {
    // Declare the parts of the presets module you are using
    export function getPresets(): Record<string, object>;
    // Add other methods/properties you use
}