from datetime import datetime
from database import db


class GameRecord(db.Model):
    __tablename__ = 'game_record'

    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    kill_count = db.Column(db.Integer, nullable=False, default=0)
    play_time = db.Column(db.Integer, nullable=False, default=0)  # seconds
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.player_name,
            'score': self.score,
            'kills': self.kill_count,
            'play_time': self.play_time,
            'created_at': self.created_at.isoformat()
        }
