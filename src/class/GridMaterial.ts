import * as THREE from "three";
import { ThreeHelper } from "../ThreeHelper";

export class GridMaterial extends THREE.ShaderMaterial {
    constructor(map: THREE.Texture | null, opacity: number) {
        super({
            uniforms: {
                color: { value: new THREE.Color(0xffffff) },
                map: { value: map },
                opacity: { value: opacity },
                iTime: ThreeHelper.instance.iTime,
            },
            vertexShader: /*glsl*/ `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /*glsl*/ `
                uniform vec3 color;
                uniform sampler2D map;
                uniform float opacity;
                uniform float iTime;
                varying vec2 vUv;

                void main() {
                    vec4 textureColor = texture2D(map, vUv);
                    gl_FragColor = vec4(color, opacity) * textureColor; 

                    

                }
            `,
            transparent: true,
        });
    }
}
