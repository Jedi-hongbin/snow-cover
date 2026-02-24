import * as THREE from "three";
import { ThreeHelper } from "../ThreeHelper";
import { LoadGLTF } from "../ThreeHelper/decorators";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { GUI } from "dat.gui";
import { GridMaterial } from "./GridMaterial";
import { LineMaterial } from "./LineMaterial";
import { FloorMaterial } from "./FloorMaterial";
import EventMesh from "../ThreeHelper/decorators/EventMesh";

type BasicMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;

export class Scene {
    scene = new THREE.Group();
    static instance: Scene;
    //围墙颜色
    wallColor = "#e26509";
    wall?: THREE.Mesh<
        THREE.BufferGeometry<THREE.NormalBufferAttributes>,
        THREE.MeshBasicMaterial,
        THREE.Object3DEventMap
    >;
    //围墙颜色2
    wallColor2 = "#0093ff";
    wall2?: THREE.Mesh<
        THREE.BufferGeometry<THREE.NormalBufferAttributes>,
        THREE.MeshBasicMaterial,
        THREE.Object3DEventMap
    >;

    selectedObjects: THREE.Mesh[] = [];

    constructor(private helper: ThreeHelper) {
        Scene.instance = this;

        // 开启阴影
        // this.helper.renderer.shadowMap.enabled = true;
        // 阴影类型
        // this.helper.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 雾化
        this.helper.scene.fog = new THREE.FogExp2(0x111111, 0.02);
        this.helper.scene.background = new THREE.Color(0x111111);

        this.loadModel();
    }

    @LoadGLTF("/public/models/city.glb")
    async loadModel(gltf?: GLTF) {
        if (gltf) {
            this.scene.add(gltf.scene);

            gltf.scene.scale.set(0.1, 0.1, 0.1);

            // 添加聚光灯
            const spotLight = new THREE.SpotLight(0xffffff, 20, 30, Math.PI / 3, 1, 1);
            spotLight.position.set(0, 15, 0);
            this.scene.add(spotLight);

            //阴影
            // spotLight.castShadow = true;
            // 阴影贴图分辨率
            spotLight.shadow.mapSize.set(1024, 1024);
            // 阴影贴图模糊度
            spotLight.shadow.radius = 1;
            // 阴影贴图偏移
            spotLight.shadow.bias = -0.001;
            spotLight.shadow.intensity = 1;

            // 便利模型 开启阴影
            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    // 材质name不包含glass
                    if (!child.material.name.includes("glass")) {
                        // child.castShadow = true;
                        // child.receiveShadow = true;
                    }
                }
            });

            const bgLine = [
                { name: "平面", opacity: 1 },
                { name: "平面001", opacity: 1 },
                { name: "平面002", opacity: 0.2 },
                { name: "平面003", opacity: 0.1 },
                { name: "平面004", opacity: 1 },
            ];

            bgLine.forEach((item) => {
                const plane = gltf.scene.getObjectByName(item.name) as BasicMesh;

                if (plane) {
                    plane.castShadow = false;
                    plane.receiveShadow = false;

                    const planeMaterialMap = plane.material.map!;

                    planeMaterialMap.wrapS = THREE.RepeatWrapping;
                    planeMaterialMap.wrapT = THREE.RepeatWrapping;
                    planeMaterialMap.repeat.set(10, 10);

                    if (item.name == "平面") {
                        // @ts-ignore
                        plane.material = new FloorMaterial(planeMaterialMap, item.opacity);
                    } else if (item.name == "平面003") {
                        planeMaterialMap.repeat.set(10, 10);

                        // @ts-ignore
                        plane.material = new GridMaterial(planeMaterialMap, item.opacity);
                        // const planeClone = new THREE.Mesh(
                        //     plane.geometry,
                        //     new THREE.MeshBasicMaterial({
                        //         color: 0xffffff,
                        //         transparent: true,
                        //         map: planeMaterialMap,
                        //         opacity: item.opacity,
                        //         side: 2,
                        //     }),
                        // );
                        // plane.add(planeClone);
                        // planeClone.position.z -= 0.02;
                    } else if (item.name == "平面004") {
                        // @ts-ignore
                        plane.material = new LineMaterial(planeMaterialMap, item.opacity);
                    } else {
                        // 替换basic材质
                        plane.material = new THREE.MeshBasicMaterial({
                            color: 0xffffff,
                            transparent: true,
                            map: planeMaterialMap,
                            opacity: item.opacity,
                        });
                    }
                }
            });

            //wrap-
            const wrapPlane = gltf.scene.children.filter((x) => x.name.includes("wrap-")) as BasicMesh[];

            wrapPlane.forEach((x) => {
                x.visible = false;
            });

            EventMesh.setIntersectObjects(wrapPlane);

            //围墙
            const wall = gltf.scene.getObjectByName("围墙") as BasicMesh;

            this.wall = wall;

            // 替换basic材质
            wall.material = new THREE.MeshBasicMaterial({
                color: this.wallColor,
            });

            //围墙2
            const wall2 = gltf.scene.getObjectByName("围墙001") as BasicMesh;

            this.wall2 = wall2;

            // 替换basic材质
            wall2.material = new THREE.MeshBasicMaterial({
                color: this.wallColor2,
            });

            const window = gltf.scene.getObjectByName("窗口") as BasicMesh;
            const window2 = gltf.scene.getObjectByName("窗口2") as BasicMesh;
            const window3 = gltf.scene.getObjectByName("窗口3") as BasicMesh;
            const window4 = gltf.scene.getObjectByName("窗口4") as BasicMesh;

            window.material = wall2.material;
            window2.material = wall2.material;
            window3.material = wall2.material;
            window4.material = wall2.material;
        }
    }

    // @EventMesh.OnMouseDown(Scene)
    // onMouseDown() {
    //     if (EventMesh.RayInfo?.object) {
    //         const targetName = EventMesh.RayInfo?.object.userData.prop.name;

    //         if (targetName) {
    //             const target = this.scene.getObjectByName(targetName.replace(".", "")) as BasicMesh;

    //             if (target) {
    //                 this.selectedObjects.length = 0;
    //                 this.selectedObjects.push(target);
    //             }
    //         }
    //     }
    // }

    addGUI(gui: GUI) {
        if (gui) {
            console.log(this.wallColor);
            gui.addColor(this, "wallColor").onChange((value) => {
                this.wall?.material.color.set(value);
            });
            //围墙2
            gui.addColor(this, "wallColor2").onChange((value) => {
                this.wall2?.material.color.set(value);
            });
        }
    }
}
