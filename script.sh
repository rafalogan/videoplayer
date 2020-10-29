ASSETSFOLDER=assets/timeline
RESOLUTIONS=(
	144
	360
	720
)


for mediafile in `ls $ASSETSFOLDER | grep .mp4`; do
	#Cut extension and resolution of file
	FILENAME=$(echo $mediafile | sed -n 's/.mp4//p' | sed -n 's/-1920x1080//p')
	INPUT=$ASSETSFOLDER/$mediafile
	FOLDER_TARGET=$ASSETSFOLDER/$FILENAME

	mkdir -p $FOLDER_TARGET

	#Create flies in other resolutions
	OUTPUT="$FOLDER_TARGET/$FILENAME"
	DURATION=$(ffprobe -i $INPUT -show_format -v quiet | sed -n 's/duration=//p')


	for resolution in ${RESOLUTIONS[*]}; do
    RESULT=$OUTPUT-$DURATION-$resolution

		if [ $resolution == 144 ]; then
			RATE=300k
		elif [ $resolution == 360 ]; then
		  RATE=400k
		else
			RATE=1500k
		fi

		if [ $resolution == 144 ]; then
		    SCALE="scale=256:144"
		else
				SCALE="scale=-1:$resolution"
		fi

    echo "Rendering in $resolution"

    ffmpeg -y -i $INPUT \
		-c:a aac -ac 2 \
		-vcodec h264 -acodec aac\
		-ab 128k\
		-movflags frag_keyframe+empty_moov+default_base_moof \
		-b:v $RATE \
		-maxrate $RATE \
		-bufsize $RATE \
		-vf "$SCALE" \
		-v quiet \
		$RESULT.mp4

		echo $RESULT.mp4

	done

done
