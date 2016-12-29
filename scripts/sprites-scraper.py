import argparse
import os
import shutil

import psycopg2
import requests


def get_image(pokemon_id: str):
    # Exception checker
    if any(pokemon in pokemon_id for pokemon in dash_exception):
        pokemon_id = pokemon_id.replace('-', '')
    elif any(pokemon in pokemon_id for pokemon in ignore_dash_exception):
        pokemon_id = pokemon_id.split('-')[0]
    elif any(pokemon in pokemon_id for pokemon in one_dash_exception):
        pokemon_id = ''.join(pokemon_id.rsplit('-', pokemon_id.count('-') - 1))
    elif any(pokemon in pokemon_id for pokemon in ignore_pikachu_exception):
        return True
    elif 'meowstic-female' in pokemon_id:
        pokemon_id = 'meowstic-f'

    front_folder_path = '{}/front'.format(folder_path)
    back_folder_path = '{}/back'.format(folder_path)

    front = requests.get('https://play.pokemonshowdown.com/sprites/xyani/{}.gif'.format(pokemon_id), stream=True)
    if front.status_code == 404:
        print('{} front image does not exist'.format(pokemon_id))
        return False
    print('front: {} KB'.format(int(front.headers['content-length']) / 1000))
    if not os.path.isdir(front_folder_path):
        os.makedirs(front_folder_path)
    with open('{}/{}.gif'.format(front_folder_path, pokemon_id), 'wb') as front_image:
        shutil.copyfileobj(front.raw, front_image)
    del front

    back = requests.get('https://play.pokemonshowdown.com/sprites/xyani-back/{}.gif'.format(pokemon_id), stream=True)
    if back.status_code == 404:
        print('{} back image does not exist'.format(pokemon_id))
        return
    print('back: {} KB'.format(int(back.headers['content-length']) / 1000))
    if not os.path.isdir(back_folder_path):
        os.makedirs(back_folder_path)
    with open('{}/{}.gif'.format(back_folder_path, pokemon_id), 'wb') as back_image:
        shutil.copyfileobj(back.raw, back_image)
    del back
    return True


parser = argparse.ArgumentParser()

parser.add_argument('host', help='PostgreSQL database host')
parser.add_argument('port', help='PostgreSQL database port')
parser.add_argument('database', help='PostgreSQL database name')
parser.add_argument('--folder', help='Folder in which the images will be saved in (default: current folder)')
parser.add_argument('--username', help='PostgreSQL database username')
parser.add_argument('--password', help='PostgreSQL database password')

args = parser.parse_args()

folder_path = args.folder
if folder_path is None:
    folder_path = os.getcwd()

host = args.host
port = args.port
database = args.database
username = args.username
password = args.password

if username is None or password is None:
    conn = psycopg2.connect(host=host, port=port, database=database)
else:
    conn = psycopg2.connect(host=host, port=port, database=database, user=username, password=password)

cursor = conn.cursor()
cursor.execute('SELECT identifier FROM pokemon ORDER BY id')
rows = cursor.fetchall()

dash_exception = ['nidoran', 'mr-mime', 'ho-oh', 'mime-jr', 'porygon-z']
ignore_dash_exception = ['deoxys-normal', 'wormadam-plant', 'giratina-altered', 'shaymin-land', 'basculin-red-striped',
                         'darmanitan-standard', 'tornadus-incarnate', 'thundurus-incarnate', 'landorus-incarnate',
                         'keldeo-ordinary', 'meloetta-aria', 'meowstic-male', 'aegislash-shield', 'pumpkaboo-average',
                         'gourgeist-average']
one_dash_exception = ['basculin-blue-striped', 'charizard-mega-x', 'charizard-mega-y', 'mewtwo-mega-x', 'mewtwo-mega-y']
ignore_pikachu_exception = ['pikachu-rock-star', 'pikachu-pop-star', 'pikachu-phd', 'pikachu-libre']
for i, row in enumerate(rows):
    print('{}:'.format(row[0]))
    if not get_image(row[0]):
        break
