import * as THREE from "three";
import { ThreeHelper } from "../ThreeHelper";

export class GridMaterial extends THREE.ShaderMaterial {
    constructor(map: THREE.Texture | null, opacity: number) {
        super({
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib['fog'],
                {
                    color: { value: new THREE.Color(0xffffff) },
                    map: { value: map },
                    opacity: { value: opacity },
                    iTime: ThreeHelper.instance.iTime,
                }
            ]),
            vertexShader: /*glsl*/ `
                #include <fog_pars_vertex>
                varying vec2 vUv;
                varying vec3 mvPosition;
                void main() {
                    vUv = uv;
                    mvPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;   
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    #include <fog_vertex>
                }
            `,
            fragmentShader: /*glsl*/ `
                #include <fog_pars_fragment>
                uniform vec3 color;
                uniform sampler2D map;
                uniform float opacity;
                uniform float iTime;
                varying vec2 vUv;
                varying vec3 mvPosition;
                
                void main() {
                    vec4 textureColor = texture2D(map, vUv * 20.);

                    float dist = distance(vUv, vec2(0.5));
                    // Create expanding rings
                    // pow(dist, 0.5) makes the rings narrower at the center and wider at the edges
                    float spread = fract(pow(dist,.5) * 2.0 - iTime * 0.2);
                    // Create a smooth wave form for the ring
                    float a = sin(spread * 3.14159);
                    // Fade out towards the edges
                    a *= (1.0 - smoothstep(0.0, 0.5, dist));

                    textureColor.rgb = mix(textureColor.rgb,vec3(0.5,0.1,1.),(a));

                    gl_FragColor = vec4(color, opacity + a*0.8) * textureColor; 
                    #include <fog_fragment>
                }
            `,
            transparent: true,
            fog: true,
        });
    }
}
