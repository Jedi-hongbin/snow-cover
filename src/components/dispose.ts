import * as THREE from "three";
import { ThreeHelper } from "@/src/ThreeHelper";
import { MethodBaseSceneSet, LoadGLTF } from "@/src/ThreeHelper/decorators";
import { MainScreen } from "@/src/components/Three/Canvas";
import { Injectable } from "@/src/ThreeHelper/decorators/DI";
import type { BackIntersection } from "@/src/ThreeHelper/decorators/EventMesh";
import type { GUI } from "dat.gui";

@Injectable
export class Main extends MainScreen {
    static instance: Main;

    constructor(private helper: ThreeHelper) {
        super(helper);
        helper.main = this;
        Main.instance = this;

        this.init();
    }

    @MethodBaseSceneSet({
        addAxis: true,
        cameraPosition: new THREE.Vector3(0, 1, 2.5),
        cameraTarget: new THREE.Vector3(0, 1, 0),
        useRoomLight: true,
    })
    async init() {}

    @ThreeHelper.InjectAnimation(Main)
    animation() {}

    @ThreeHelper.AddGUI(Main)
    Gui(gui: GUI) {
        if (gui) {
            const group: THREE.Mesh[] = [];

            gui.addFunction(() => {
                // 随机创建100个位置随机的mesh
                for (let index = 0; index < 100; index++) {
                    const mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(0.1, 0.1, 0.1, 100, 100, 100),
                        new THREE.MeshBasicMaterial({ color: 0xff0000 })
                    );
                    this.helper.add(mesh);
                    group.push(mesh);

                    mesh.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
                }
                console.log(group);
            });

            gui.addFunction(() => {
                group.forEach((mesh) => {
                    mesh.parent?.remove(mesh);
                    mesh.geometry.dispose();
                    // @ts-ignore
                    mesh.material.dispose();
                });
                group.length = 0;
            });
        }
    }
}
