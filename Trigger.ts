module TiledChunks {

    export class Trigger extends Phaser.Sprite {


        public colliders: Phaser.Sprite[];
        public id: number;
        public name: string;
        public key: string;


        public AddCollider(_collider: Phaser.Sprite): void {
            this.colliders.push(_collider);
        }


        public HasCollider(_collider: Phaser.Sprite): boolean {
            var c: number = 0;
            while (c < this.colliders.length && this.colliders[c] != _collider)
                c++;
            return c < this.colliders.length;
        }


        public RemoveCollider(_collider: Phaser.Sprite): void {
            var c: number = 0;
            while (c < this.colliders.length && this.colliders[c] != _collider)
                c++;
            if (c < this.colliders.length)
                this.colliders.splice(c, 1);
        }


        constructor(_game: Phaser.Game, _id: number, _x: number, _y: number) {

            this.colliders = [];
            this.id = _id;
            this.key = "TriggerSprite" + _x + "/" + _y;

            super(_game, _x, _y);
            
        }
    }

}