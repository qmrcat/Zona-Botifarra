# 🃏 Botifarra - Joc de Cartes Català

Un joc de cartes tradicional català implementat com a aplicació web autònoma. Juga contra tres bots intel·ligents que respecten totes les regles del reglament oficial de la Botifarra (versió lliure o occidental).

## 📖 Descripció

La **Botifarra** és un joc de cartes popular a Catalunya que es juga amb 4 jugadors en parelles. Aquesta implementació web permet jugar sol contra tres jugadors controlats per intel·ligència artificial.

### Característiques principals

- 🎮 **Joc complet**: Implementació fidel al reglament oficial
- 🤖 **IA intel·ligent**: Els bots prenen decisions estratègiques
- 📱 **Responsive**: Disseny optimitzat per a escriptori, tauleta i mòbil
- 🎨 **Disseny elegant**: Interfície visual amb temàtica tradicional catalana
- 💾 **Sense dependències**: Funciona amb un sol arxiu HTML
- 📊 **Estadístiques**: Resum detallat de cada mà al final de la partida

## 🎯 Regles del Joc

### Objectiu
Arribar als **101 punts** abans que la parella contrària.

### Jugadors
- 4 jugadors en parelles (Tu + Nord vs Est + Oest)
- Els companys seuen l'un davant de l'altre

### La Baralla
48 cartes dividides en 4 pals:
- 🪙 **Oros**
- 🏆 **Copes**
- ⚔️ **Espases**
- 🌿 **Bastos**

### Valor de les Cartes (de més a menys)

| Carta | Nom | Punts |
|-------|-----|-------|
| 9 | Manilla | 5 |
| 1 | As | 4 |
| 12 | Rei | 3 |
| 11 | Cavall | 2 |
| 10 | Sota | 1 |
| 8-2 | - | 0 |

**Total per mà**: 72 punts (60 de cartes + 12 de bases)

### Fases del Joc

#### 1. Repartir
- Es reparteixen 12 cartes a cada jugador (de 4 en 4)
- El repartidor canvia cada mà (sentit antihorari)

#### 2. Escollir Triomf
El repartidor pot:
- Escollir un pal com a triomf (Oros, Copes, Espases o Bastos)
- Declarar **BOTIFARRA** (sense triomf, punts dobles)
- Passar al company (que haurà d'escollir obligatòriament)

#### 3. Contro, Recontro i Sant Vicenç

| Acció | Qui pot | Multiplicador |
|-------|---------|---------------|
| Contro | Parella contrària | ×2 |
| Recontro | Parella que ha fet triomf | ×4 |
| Sant Vicenç | Parella que ha contrat (només si no és botifarra) | ×8 |

#### 4. Jugar les Cartes

**Regles per jugar:**

1. **Primera carta**: Es pot jugar qualsevol carta
2. **Resta de jugadors**:
   - Si la basa va del company: seguir el pal de sortida (sense obligació de matar)
   - Si la basa no va del company:
     - Seguir el pal i matar si es pot
     - Si no tens el pal: jugar triomf que mati
     - Si no pots matar: jugar qualsevol carta

#### 5. Última Basa
- Quan només queda una carta a cada jugador, es juguen automàticament

#### 6. Puntuació
- La parella que passa de 36 punts guanya la mà
- S'anoten els punts per sobre de 36, multiplicats segons contro/recontro/Sant Vicenç

## 🖥️ Interfície

### Elements de Pantalla (Escriptori)

- **Marcador**: Puntuació de cada parella (a dalt al centre)
- **Triomf**: Pal escollit per la mà actual (a dalt a la dreta)
- **Multiplicador**: Factor de punts actual (a dalt a l'esquerra)
- **Zona de joc**: On es juguen les cartes (al centre)
- **Piles de bases**: Cartes guanyades per cada jugador (al costat de cada jugador)
- **Log**: Historial de jugades (a baix a l'esquerra, es pot amagar)

### Elements de Pantalla (Mòbil)

- **Vista simplificada**: Només es mostren les cartes del jugador humà
- **Comptador de bases**: Integrat al nom de cada jugador
- **Mà en graella**: 2 files de 6 cartes per millor visualització
- **Log ocult**: Per defecte amagat per maximitzar l'espai

### Interaccions

- **Clicar carta**: Jugar una carta (només les jugables es poden seleccionar)
- **Clicar pila de bases**: Veure l'última basa guanyada per aquell jugador
- **Clicar comptador de bases (mòbil)**: Veure l'última basa guanyada
- **Botons de triomf**: Escollir triomf quan et toca
- **Botons de contro**: Decidir si contrar/recontrar

### Indicadors Visuals

- 💫 **Nom il·luminat**: Indica quin jugador ha de jugar
- 🎴 **Emoji al nom**: Indica qui ha repartit
- ⭐ **Estrella a última basa**: Indica el guanyador de la basa

## 📊 Resum de Partida

Al final de cada partida es mostra un resum detallat amb:

- **Marcador final**: Puntuació total de cada equip
- **Taula d'historial**: Per cada mà jugada:
  - Número de mà
  - Triomf escollit
  - Multiplicador aplicat
  - Bases guanyades per equip
  - Punts de figures per equip
  - Total de punts per equip
  - Punts anotats

## 📱 Versió Mòbil

La interfície s'adapta automàticament a pantalles petites:

- **Mans dels bots ocultes**: Més espai per la zona de joc
- **Cartes en graella 2×6**: Millor visualització de la mà
- **Comptadors integrats**: Les bases guanyades es mostren al nom
- **Log amagat**: Més espai disponible
- **Scroll horitzontal**: A la taula de resum si cal
- **Modals adaptats**: Panells de selecció optimitzats

## 🛠️ Tecnologies

- **HTML5**: Estructura
- **CSS3**: Estils, animacions i disseny responsive
- **JavaScript**: Lògica del joc i IA
- **Google Fonts**: Tipografies (Playfair Display, Source Sans Pro)

## 📁 Arxius

```
botifarra.html    # Aplicació completa (únic arxiu necessari)
README.md         # Aquest document
```

## 🚀 Com Jugar

1. Obre l'arxiu `botifarra.html` amb qualsevol navegador modern
2. Clica "Començar Partida"
3. Juga!

**Opcions al final de partida:**
- **Nova Partida**: Començar una nova partida amb el marcador reiniciat
- **Menú Principal**: Tornar a la pantalla inicial

No cal servidor web, connexió a internet (després de carregar), ni instal·lació.

## 🎲 Estratègia de la IA

Els bots implementen diverses estratègies:

### Elecció de Triomf
- Analitzen la força de cada pal a la mà
- Prefereixen pals llargs amb cartes altes
- Consideren fer botifarra amb mans equilibrades i fortes
- Poden delegar al company si la mà és feble

### Decisió de Contro
- Avaluen la força global de la mà
- Compten triomfs i cartes de valor
- Prenen riscos calculats segons les probabilitats

### Joc de Cartes
- **Sortida**: Prefereixen pals llargs amb cartes altes
- **Seguiment**: Maten quan cal, guarden punts quan poden
- **Descart**: Eliminen cartes febles de pals curts
- **Final de basa**: Optimitzen segons els punts en joc

## 📜 Reglament Original

Aquest joc segueix el reglament de la Botifarra en la seva versió "lliure" o "occidental". Les regles principals implementades són:

- ✅ Repartiment de 4 en 4 cartes
- ✅ Elecció de triomf amb opció de delegar
- ✅ Sistema complet de contro/recontro/Sant Vicenç
- ✅ Obligació de seguir pal
- ✅ Obligació de matar cartes dels contraris
- ✅ Llibertat quan la basa va del company
- ✅ Puntuació correcta amb multiplicadors
- ✅ Partida a 101 punts
- ✅ Última basa jugada automàticament
- ✅ Possibilitat de revisar l'última basa guanyada
- ✅ Resum detallat de la partida

## 🐛 Problemes Coneguts

- En pantalles molt petites (<320px) alguns elements poden solapar-se

## 📄 Llicència

Projecte de codi obert. Lliure per utilitzar, modificar i distribuir.

## 🙏 Crèdits

- Reglament basat en el document "Reglament de Botifarra" (versió lliure/occidental)
- Icones de pals mitjançant emojis Unicode
- Tipografies de Google Fonts

---

*Fet amb ❤️ per als amants dels jocs de cartes catalans*