import * as THREE from "three";
import { ThreeHelper } from "../ThreeHelper";
import { LoadGLTF } from "../ThreeHelper/decorators";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export class Scene {
    scene = new THREE.Group();
    static instance: Scene;

    constructor(private helper: ThreeHelper) {
        Scene.instance = this;

        this.loadModel();
    }

    @LoadGLTF("/public/models/city.glb")
    async loadModel(gltf?: GLTF) {
        if (gltf) {
            this.scene.add(gltf.scene);
            
            gltf.scene.scale.set(0.1, 0.1, 0.1);
            gltf.scene.position.x += 10;
            gltf.scene.position.z += 10;
        }
    }
}
