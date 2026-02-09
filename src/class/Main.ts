import * as THREE from "three";
import { ThreeHelper } from "@/src/ThreeHelper";
import { MethodBaseSceneSet, LoadGLTF } from "@/src/ThreeHelper/decorators";
import { MainScreen } from "@/src/components/Three/Canvas";
import { Injectable } from "@/src/ThreeHelper/decorators/DI";
import type { GUI } from "dat.gui";
import { Scene } from "@/src/class/Scene";
import { Effect } from "@/src/class/effect";

@Injectable
export class Main extends MainScreen {
    static instance: Main;
    _scene!: Scene;
    _effect!: Effect;

    constructor(private helper: ThreeHelper) {
        super(helper);
        helper.main = this;
        Main.instance = this;

        this.init();
    }

    @MethodBaseSceneSet({
        addAxis: 10,
        cameraPosition: new THREE.Vector3(0, 20, 20),
        cameraTarget: new THREE.Vector3(0, 0, 0),
        useRoomLight: true,
        near: 0.3,
        far: 100,
    })
    async init() {
        this._scene = new Scene(this.helper);
        this.helper.add(this._scene.scene);
        this.helper.renderer.setPixelRatio(2);

        // 创建后期渲染
        this._effect = new Effect(this.helper);

        this.helper.render = () => {
            this._effect.render();
        };
    }

    @ThreeHelper.InjectAnimation(Main)
    animation() {}

    @ThreeHelper.AddGUI(Main)
    Gui(gui: GUI) {
        if (gui) {
            this._effect?.addGui(gui);
        }
    }
}
