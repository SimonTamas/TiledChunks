module TiledChunks {

    export class MapLayer {

        group: Phaser.Group;
        data: TiledChunks.LayerData;

        constructor(_group: Phaser.Group, _data: TiledChunks.LayerData) {
            this.group = _group;
            this.data = _data;
        }

    }

}