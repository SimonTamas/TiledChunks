module TiledChunks {
    export class MapData {
        
        wordWidth: number;
        worldHeight: number;

        viewportWidth: number;
        viewportHeight: number;

        chunkTileColumns: number;
        chunkTileRows: number;

        tileWidth: number;
        tileHeight: number;

        chunkWidth: number;
        chunkHeight: number;

        chunkColumns: number;
        chunkRows: number;

        tileCountX: number;
        tileCountY: number;

        chunkNeedCacheHorizontal: number;
        chunkNeedCacheVertical: number;

        layers: TiledChunks.LayerData[];
        tilesets: TiledChunks.Tileset[];
        
        public ListToMatrix(list: number[]): number[][]
        {
            var matrix = [], i, k;
            for (i = 0, k = -1; i < list.length; i++) {
                if (i % this.tileCountX === 0) {
                    k++;
                    matrix[k] = [];
                }
                matrix[k].push(list[i]);
            }
            return matrix;
        }

        public GetTextureKeyForId(_tileID: number): string
        {
            return this.GetTilesetForId(_tileID).textureKey;
        }

        public GetTilesetForId(_tileID: number): TiledChunks.Tileset {
            var i: number = 0;
            while (i < this.tilesets.length && this.tilesets[i].fromID > _tileID || this.tilesets[i].toID < _tileID)
                i++;
            return this.tilesets[i];
        }

        public GetFrameForId(_tileID: number): number {
            return this.GetTilesetForId(_tileID).GetFrameFromId(_tileID);
        }

        public CalculateNeededChunkCacheSizes(): void {
            // Find the chunks first biggest multiply 
            var foundWidth:number = 0;
            var foundHeight:number = 0;
            var needWidth: number = this.viewportWidth;
            var needHeight: number = this.viewportHeight;
            while (foundWidth < needWidth)
                foundWidth += this.chunkWidth;
            while (foundHeight < needHeight)
                foundHeight += this.chunkHeight;
            

            this.chunkNeedCacheHorizontal = Math.floor(foundWidth / this.chunkWidth / 2);
            this.chunkNeedCacheVertical = Math.floor(foundHeight / this.chunkHeight / 2);

            console.log(this.chunkNeedCacheHorizontal + "/" + this.chunkNeedCacheVertical);
        }

        constructor(_worldWidth: number, _worldHeight: number, _viewportWidth: number, _viewportHeight: number, _chunkTileRows: number, _chunkTileColumns: number, _tileWidth: number, _tileHeight: number, _tiledMap: JSON, _usedLayers: TiledChunks.LayerData[], _tilesets: TiledChunks.Tileset[])
        {

            this.wordWidth = _worldWidth;
            this.worldHeight = _worldHeight;

            this.viewportWidth = _viewportWidth;
            this.viewportHeight = _viewportHeight;

            this.tileWidth = _tileWidth;
            this.tileHeight = _tileHeight;


            this.chunkTileRows = _chunkTileRows;
            this.chunkTileColumns = _chunkTileColumns;


            this.chunkWidth = _chunkTileColumns * _tileWidth;
            this.chunkHeight = _chunkTileRows * _tileHeight;

            this.chunkColumns = this.wordWidth / this.chunkWidth;
            this.chunkRows = this.worldHeight / this.chunkHeight;

            this.tileCountX = this.chunkColumns * this.chunkTileColumns;
            this.tileCountY = this.chunkRows * this.chunkTileRows;

            // Now that we now everything about the map/chunk/tiles/viewport
            // We must calculate how many chunks we have to render 

            this.CalculateNeededChunkCacheSizes();
            
            // Convert Tiled's one dimensional array into a matrix
            this.layers = _usedLayers;
            var uL: TiledChunks.LayerData;
            var tiles: number[][];
            for (var l: number = 0; l < _tiledMap["layers"].length; l++) {
                for (var u: number = 0; u < this.layers.length; u++) {
                    uL = this.layers[u];
                    if (uL.name == _tiledMap["layers"][l]["name"]) {
                        uL.SetTiles(this.ListToMatrix(_tiledMap["layers"][l]["data"]));
                    }
                }
            }

            // Tileset handling
            this.tilesets = _tilesets;
            for (var t: number = 0; t < _tiledMap["tilesets"].length; t++) {
                for (var s: number = 0; s < this.tilesets.length; s++) {
                    if (this.tilesets[s].name == _tiledMap["tilesets"][t]["name"]) {
                        var from: number = _tiledMap["tilesets"][t]["firstgid"];
                        var count: number = _tiledMap["tilesets"][t]["tilecount"];
                        this.tilesets[s].fromID = from;
                        this.tilesets[s].toID = from + count;
                    }
                }
            }
        }
    }
}