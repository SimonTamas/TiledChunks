module TiledChunks {

    export class MapLayer {

        container: any;
        data: TiledChunks.LayerData;

        constructor(_container: any, _data: TiledChunks.LayerData) {
            this.container = _container;
            this.data = _data;
        }

    }

}