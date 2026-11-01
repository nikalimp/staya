# Музыка STAYA

Треки — пример от команды (DJ-эдиты Klën). Пережаты для веба: 128 kbps, громкость −14 LUFS.

| Файл | Сцена | Трек |
|---|---|---|
| `01-aqua.mp3` | AQUA | Klën & KIDDI — СВАГА (edit) |
| `02-2k17.mp3` | 2K17 | Klën — DIKO THRU THE 7TH NAPRIMER (2K17VIB33DIT) |
| `03-pool.mp3` | POOL | Klën — НА ЗАРЕ (edit) |
| `04-halloween.mp3` | Дворец | Klën — SHOCK ID (edit) |
| `05-phuket.mp3` | Вилла и офис | Klën & REDSQUARE — ЦЕЗАРЬ (edit) |

Вилла и офис играют один трек: при переходе в офис музыка не прерывается.
Заменить трек: положите новый mp3 с тем же именем. Пережать: `ffmpeg -i in.mp3 -af loudnorm=I=-14:TP=-1.5 -b:a 128k out.mp3`.
