﻿module TiledChunks {

    export class Map
    {
        game: Phaser.Game;
        container: Phaser.Group;
        data: TiledChunks.MapData;
        chunks: TiledChunks.Chunk[][];
        

        centerChunk: TiledChunks.Chunk;
        cameraChunkRow: number;
        cameraChunkColumn: number;

        listeners: TiledChunks.MapListener[];
        layers: TiledChunks.MapLayer[];
        colliders: Phaser.Sprite[];


        public AddListener(_event: string, _callback: Object): void
        {
            this.listeners.push(new TiledChunks.MapListener(_event, _callback));
        }

        public RemoveListener(_event: string) : void
        {

        }

        public GetLayer(_name: string): TiledChunks.MapLayer {
            var i:number = 0;
            while (i < this.layers.length && this.layers[i].data.name != _name)
                i++;
            return this.layers[i];
        }

        public AddToLayer(_sprite: Phaser.Sprite, _layer: string, _collision?: boolean): void {
            var layer: MapLayer = this.GetLayer(_layer)
            layer.group.add(_sprite);
            if (_collision) {
                this.colliders.push(_sprite);
            }
        }

        public UpdateChunksAround(_cR: number, _cC: number): void {

            for (var r: number = 0; r < this.chunks.length; r++) {
                for (var c: number = 0; c < this.chunks[r].length; c++) {
                    this.chunks[r][c].PrematureDeactivation();
                }
            }

            this.centerChunk = this.chunks[_cR][_cC];
            this.centerChunk.Activate();
            this.centerChunk.ActivateAdjacent();

            for (var r: number = 0; r < this.chunks.length; r++) {
                for (var c: number = 0; c < this.chunks[r].length; c++) {
                    this.chunks[r][c].DeactivationCheck();
                }
            }
        }


        public UpdateCollisions(): void {

            for (var i: number = 0; i < this.colliders.length; i++) {
                for (var c: number = 0; c < this.centerChunk.layers.length; c++) {
                    for (var v = 0; v < this.centerChunk.layers[c].colliders.length; v++) {
                        this.game.physics.arcade.collide(this.colliders[i], this.centerChunk.layers[c].colliders[v].tile);
                    }
                }
            }
        }

        public UpdateMap(): void {
            
            
            var camera_centerX = this.game.camera.x + (this.game.camera.width / 2);
            var camera_centerY = this.game.camera.y + (this.game.camera.height / 2)

            var camera_chunkRow = Math.floor(camera_centerY / this.data.chunkHeight);
            var camera_chunkColumn = Math.floor(camera_centerX / this.data.chunkWidth);

            if (camera_chunkRow != this.cameraChunkRow || camera_chunkColumn != this.cameraChunkColumn) {
                this.cameraChunkRow = camera_chunkRow;
                this.cameraChunkColumn = camera_chunkColumn;
                this.UpdateChunksAround(this.cameraChunkRow, this.cameraChunkColumn);
            }

            this.UpdateCollisions();
        }

        public CacheAdjacentChunks(): void {
            for (var r: number = 0; r < this.chunks.length; r++) {
                for (var c: number = 0; c < this.chunks[r].length; c++) {
                    this.chunks[r][c].CacheAdjacentChunks(this.data.chunkNeedCacheHorizontal, this.data.chunkNeedCacheVertical);
                }
            }
        }

        constructor(_game: Phaser.Game, _data: TiledChunks.MapData)
        {
            this.game = _game;
            this.data = _data;
            this.container = new Phaser.Group(_game);
            this.colliders = [];

            // Create a group for each layer
            this.layers = [];
            var layerGroup: Phaser.Group;
            var layerData: TiledChunks.LayerData;
            for (var l: number = 0; l < this.data.layers.length; l++)
            {
                layerData = this.data.layers[l];
                layerGroup = new Phaser.Group(this.game, this.container, layerData.name);
                this.layers.push(new TiledChunks.MapLayer(layerGroup, layerData));
            }
            
            

            // Create the Chunks
            this.chunks = [];
            var chunk: Chunk;
            for (var r: number = 0; r < this.data.chunkRows; r++) {
                this.chunks[r] = [];
                for (var c: number = 0; c < this.data.chunkColumns; c++) {
                    chunk = new TiledChunks.Chunk(this, r, c);
                    this.chunks[r][c] = chunk;
                }
            }

            // Each chunk has adjacent chunks 
            // around it, we cache them so
            // we dont have to calculate it later
            this.CacheAdjacentChunks();

            this.UpdateMap();

            console.log(this.container);
            console.log("Chunks : " + Chunk.chunks);
            console.log(Tile.tiles);
        }
    }
}