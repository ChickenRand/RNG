#!/bin/bash

# Nom du paquet .deb
PACKAGE_NAME="onerng_3.6-1_all.deb"

# Répertoire temporaire pour extraire le paquet
TEMP_DIR=$(mktemp -d)

# Extraire le contenu du paquet .deb
dpkg-deb -R "$PACKAGE_NAME" "$TEMP_DIR"

# Chemin vers le fichier de contrôle
CONTROL_FILE="$TEMP_DIR/DEBIAN/control"

# Modifier les dépendances dans le fichier de contrôle
sed -i 's/python, python-gnupg/python3, python3-gnupg/' "$CONTROL_FILE"

# Recréer le paquet .deb avec les modifications
dpkg-deb -b "$TEMP_DIR" "modified_${PACKAGE_NAME}"

# Nettoyer
rm -rf "$TEMP_DIR"

echo "Nouveau paquet créé : modified_${PACKAGE_NAME}"
