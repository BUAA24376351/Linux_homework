import os
import random
from flask import Flask, request, jsonify, send_from_directory
from database import init_db, db
from models import GameRecord

app = Flask(__name__, static_folder='../frontend')

# Initialize database
init_db(app)

# Path to frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')


# ===== Static Routes =====
@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/<path:path>')
def static_files(path):
    file_path = os.path.join(FRONTEND_DIR, path)
    if os.path.exists(file_path):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, 'index.html')


# ===== API Routes =====

@app.route('/api/record', methods=['POST'])
def save_record():
    """Save a game record."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        record = GameRecord(
            player_name=data.get('player_name', 'Anonymous'),
            score=int(data.get('score', 0)),
            kill_count=int(data.get('kill_count', 0)),
            play_time=int(data.get('play_time', 0))
        )
        db.session.add(record)
        db.session.commit()
        return jsonify({'message': 'Record saved', 'id': record.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/ranking', methods=['GET'])
def get_ranking():
    """Get the ranking list, ordered by score descending."""
    try:
        records = GameRecord.query.order_by(
            GameRecord.score.desc()
        ).limit(20).all()
        return jsonify([r.to_dict() for r in records])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/mcp', methods=['POST'])
def mcp_advice():
    """AI Commander - provides tactical advice based on game state."""
    data = request.get_json() or {}

    hp = data.get('hp', 0)
    enemy_count = data.get('enemyCount', 0)
    total_kills = data.get('totalKills', 0)
    base_alive = data.get('baseAlive', True)

    # Generate tactical advice based on game state
    advices = []

    if enemy_count == 0 and total_kills > 0:
        advices.append("🎯 目标已全部清除！战场安全。")
    elif enemy_count > 3:
        advices.append("⚠️ 敌军数量较多，建议优先防守基地，不要贸然出击。")
    elif enemy_count > 1:
        advices.append("🔍 敌军仍在活动，保持移动，避免停在开阔地带。")

    if hp == 1:
        advices.append("💔 血量危险！注意躲避敌方子弹。")
    elif hp == 2:
        advices.append("❤️ 血量中等，注意保护自己。")
    elif hp >= 3:
        advices.append("💪 血量充足，可以主动出击！")

    if not base_alive:
        advices.append("🏠 基地已被摧毁... 任务失败。")
    else:
        advices.append("🏠 基地安全，继续战斗！")

    if total_kills == 0 and enemy_count > 0:
        advices.append("🎯 尚未击毁任何敌军，瞄准后再开火！")
    elif total_kills > 0:
        advices.append(f"⚡ 已击毁 {total_kills} 辆敌军，保持这个势头！")

    # Suggest player position strategy
    advices.append("💡 利用砖墙作为掩体，在墙后伏击敌军效果更佳。")

    # Random tips
    tips = [
        "🎮 提示：子弹可以穿过狭窄的通道击中远处的敌人。",
        "🎮 提示：河流无法通过，注意利用地形阻挡敌军。",
        "🎮 提示：钢墙无法被摧毁，但可以利用它反弹子弹。",
        "🎮 提示：敌军会随机改变方向，预判它们的移动路线。",
        "🎮 提示：保护好基地比击杀所有敌人更重要！",
    ]
    advices.append(random.choice(tips))

    return jsonify({
        'advice': '\n'.join(advices),
        'status': 'ok'
    })


if __name__ == '__main__':
    print("=" * 50)
    print("  Tank Battle Online Server")
    print("  Running at http://localhost:8000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=8000, debug=True)
