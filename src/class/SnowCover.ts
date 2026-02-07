/**
 * 雪覆盖 后期处理
 */
import {
    WebGLRenderer,
    WebGLRenderTarget,
    Texture,
    ShaderMaterial,
    Scene,
    Camera,
    Color,
    DoubleSide,
    NearestFilter,
    RGBAFormat
} from "three";
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass";

export class SnowCover extends Pass {
    uniforms: { 
        tDiffuse: { value: Texture | null },
        tNormal: { value: Texture | null },
        uSnowColor: { value: Color },
        uThreshold: { value: number },
        uOpacity: { value: number }
    };
    material: ShaderMaterial;
    private _fsQuad: FullScreenQuad;
    private normalRenderTarget: WebGLRenderTarget;
    private normalMaterial: ShaderMaterial;
    private scene: Scene;
    private camera: Camera;

    /**
     * Constructs a new output pass.
     */
    constructor(scene: Scene, camera: Camera) {
        super();

        this.scene = scene;
        this.camera = camera;

        // Create a render target for normals
        this.normalRenderTarget = new WebGLRenderTarget(window.innerWidth, window.innerHeight);
        this.normalRenderTarget.texture.format = RGBAFormat;
        this.normalRenderTarget.texture.minFilter = NearestFilter;
        this.normalRenderTarget.texture.magFilter = NearestFilter;

        // Material to capture world normals
        this.normalMaterial = new ShaderMaterial({
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    // Calculate world normal
                    vNormal = normalize(mat3(modelMatrix) * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                void main() {
                    // Pack normal to 0..1 range
                    gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);
                }
            `,
            side: DoubleSide
        });

        /**
         * The pass uniforms.
         */
        this.uniforms = {
            tDiffuse: { value: null },
            tNormal: { value: null },
            uSnowColor: { value: new Color(0xffffff) },
            uThreshold: { value: 1 },
            uOpacity: { value: 1.0 }
        };

        /**
         * The pass material.
         */
        this.material = new ShaderMaterial({
            name: "SnowCover",
            uniforms: this.uniforms,
            vertexShader: `
                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D tDiffuse;
                uniform sampler2D tNormal;
                uniform vec3 uSnowColor;
                uniform float uThreshold;
                uniform float uOpacity;

                void main() {
                    vec4 diffuse = texture2D(tDiffuse, vUv);
                    vec4 normalData = texture2D(tNormal, vUv);
                    
                    // If normalData is transparent (background), skip snow
                    if (normalData.a < 0.1) {
                        gl_FragColor = diffuse;
                        return;
                    }

                    vec3 normal = normalize(normalData.rgb * 2.0 - 1.0);

                    // Up vector in world space is (0, 1, 0)
                    float snowFactor = dot(normal, vec3(0.0, 1.0, 0.0));

                    // Smooth transition
                    float s = smoothstep(uThreshold, uThreshold + 0.2, snowFactor);
                    
                    vec3 finalColor = mix(diffuse.rgb, uSnowColor, s * uOpacity);
                    
                    gl_FragColor = vec4(finalColor, diffuse.a);
                }
            `,
        });

        this._fsQuad = new FullScreenQuad(this.material);
    }

    /**
     * Performs the output pass.
     */
    render(
        renderer: WebGLRenderer,
        writeBuffer: WebGLRenderTarget,
        readBuffer: WebGLRenderTarget /*, deltaTime, maskActive */,
    ) {
        // 1. Render Normals
        const originalOverride = this.scene.overrideMaterial;
        const originalRenderTarget = renderer.getRenderTarget();
        const originalClearColor = new Color();
        renderer.getClearColor(originalClearColor);
        const originalClearAlpha = renderer.getClearAlpha();

        this.scene.overrideMaterial = this.normalMaterial;
        renderer.setRenderTarget(this.normalRenderTarget);
        renderer.setClearColor(0x000000, 0); // Clear to transparent
        renderer.clear();
        renderer.render(this.scene, this.camera);

        // Restore state
        this.scene.overrideMaterial = originalOverride;
        renderer.setRenderTarget(originalRenderTarget);
        renderer.setClearColor(originalClearColor, originalClearAlpha);

        // 2. Render Snow Effect
        this.uniforms["tDiffuse"].value = readBuffer.texture;
        this.uniforms["tNormal"].value = this.normalRenderTarget.texture;

        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
            this._fsQuad.render(renderer);
        } else {
            renderer.setRenderTarget(writeBuffer);
            if (this.clear) renderer.clear();
            this._fsQuad.render(renderer);
        }
    }

    setSize(width: number, height: number) {
        this.normalRenderTarget.setSize(width, height);
    }

    /**
     * Frees the GPU-related resources allocated by this instance. Call this
     * method whenever the pass is no longer used in your app.
     */
    dispose() {
        this.material.dispose();
        this._fsQuad.dispose();
        this.normalRenderTarget.dispose();
        this.normalMaterial.dispose();
    }
}
