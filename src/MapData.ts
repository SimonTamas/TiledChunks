﻿module TiledChunks {
    export class MapData {
        
        worldWidth: number;
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

        fixedMap: boolean;

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
            while (i < this.tilesets.length && !(this.tilesets[i].fromID <= _tileID && _tileID < this.tilesets[i].toID) )
                i++;
            if (i < this.tilesets.length)
                return this.tilesets[i];
            else {
                // TODO: Tileset is missing what now?!
            }
        }

        public GetTileset(_name: string): TiledChunks.Tileset {
            var i: number = 0;
            while (i < this.tilesets.length && this.tilesets[i].name != _name)
                i++;
            if (i < this.tilesets.length)
                return this.tilesets[i];
        }

        public GetFrameForId(_tileID: number): number {
            var tileSet: TiledChunks.Tileset = this.GetTilesetForId(_tileID);
            if (tileSet)
                return tileSet.GetFrameFromId(_tileID);
            else
                return -1;
        }

        public CalculateNeededChunkCacheSizes(): void {
            // Find the chunks first biggest multiply 
            var foundWidth:number = 0;
            var foundHeight: number = 0;
            var needWidth: number = (this.viewportWidth - this.chunkWidth) / 4;
            var needHeight: number = (this.viewportHeight - this.chunkHeight) /4;

            while (needWidth > foundWidth)
                foundWidth += this.chunkWidth;
            while (needHeight > foundHeight)
                foundHeight += this.chunkHeight;
            

            this.chunkNeedCacheHorizontal = Math.ceil(foundWidth / this.chunkWidth);
            this.chunkNeedCacheVertical = Math.ceil(foundHeight / this.chunkHeight);
            
        }

        constructor(_worldWidth: number, _worldHeight: number, _viewportWidth: number, _viewportHeight: number, _chunkTileRows: number, _chunkTileColumns: number, _tileWidth: number, _tileHeight: number, _tiledMap: JSON, _usedLayers: TiledChunks.LayerData[], _tilesets: TiledChunks.Tileset[], _fixedMap?: boolean)
        {

            this.worldWidth = _worldWidth;
            this.worldHeight = _worldHeight;

            this.viewportWidth = _viewportWidth;
            this.viewportHeight = _viewportHeight;

            this.tileWidth = _tileWidth;
            this.tileHeight = _tileHeight;


            this.chunkTileRows = _chunkTileRows;
            this.chunkTileColumns = _chunkTileColumns;


            this.chunkWidth = _chunkTileColumns * _tileWidth;
            this.chunkHeight = _chunkTileRows * _tileHeight;

            this.chunkColumns = this.worldWidth / this.chunkWidth;
            this.chunkRows = this.worldHeight / this.chunkHeight;

            this.tileCountX = this.chunkColumns * this.chunkTileColumns;
            this.tileCountY = this.chunkRows * this.chunkTileRows;

            this.fixedMap = _fixedMap;

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
            var foundTileset: boolean;
            var dummyTileset: TiledChunks.Tileset;
            for (var t: number = 0; t < _tiledMap["tilesets"].length; t++) {
                foundTileset = false;

                var from: number = _tiledMap["tilesets"][t]["firstgid"];
                var count: number = _tiledMap["tilesets"][t]["tilecount"];
                var customProperties: Object = _tiledMap["tilesets"][t]["tileproperties"];

                for (var s: number = 0; s < this.tilesets.length; s++) {
                    if (this.tilesets[s].name == _tiledMap["tilesets"][t]["name"]) {
                        foundTileset = true;
                        this.tilesets[s].fromID = from;
                        this.tilesets[s].toID = from + count;
                        this.tilesets[s].properties = customProperties;
                    }
                }

                if (!foundTileset) {
                    dummyTileset = new TiledChunks.Tileset(_tiledMap["tilesets"][t]["name"], null);
                    dummyTileset.fromID = from;
                    dummyTileset.toID = from + count;
                    dummyTileset.properties = customProperties;
                    this.tilesets.push(dummyTileset);
                }
            }
            foundTileset = null;
            dummyTileset = null;
        }
    }
}