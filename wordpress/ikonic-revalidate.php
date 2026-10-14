<?php
/**
 * Plugin Name: Ikonic revalidate
 * Description: Tells the Next.js site to refresh its cached pages when content changes.
 *
 * Install: copy this file to wp-content/mu-plugins/ and add to wp-config.php:
 *   define( 'IKONIC_SITE_URL', 'https://ikonicdesigns.co.za' );
 *   define( 'IKONIC_REVALIDATE_SECRET', 'same value as REVALIDATE_SECRET in Vercel' );
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function ikonic_revalidate( array $tags ) {
	if ( ! defined( 'IKONIC_SITE_URL' ) || ! defined( 'IKONIC_REVALIDATE_SECRET' ) ) {
		return;
	}
	wp_remote_post(
		trailingslashit( IKONIC_SITE_URL ) . 'api/revalidate',
		array(
			'timeout'  => 5,
			'blocking' => false,
			'headers'  => array(
				'content-type'        => 'application/json',
				'x-revalidate-secret' => IKONIC_REVALIDATE_SECRET,
			),
			'body'     => wp_json_encode( array( 'tags' => array_values( array_unique( $tags ) ) ) ),
		)
	);
}

/** Post type => cache tags on the site. Clients also feed the case-study links on logos. */
function ikonic_tags_for( $post_type ) {
	$map = array(
		'project'    => array( 'projects', 'clients' ),
		'client'     => array( 'clients' ),
		'teammember' => array( 'team' ),
		'team_member' => array( 'team' ),
	);
	return $map[ $post_type ] ?? array();
}

function ikonic_on_post_change( $post_id ) {
	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	$tags = ikonic_tags_for( get_post_type( $post_id ) );
	if ( $tags ) {
		ikonic_revalidate( $tags );
	}
}
add_action( 'save_post', 'ikonic_on_post_change' );
add_action( 'before_delete_post', 'ikonic_on_post_change' );
add_action( 'trashed_post', 'ikonic_on_post_change' );

// Replacing an image file changes what pages show, so refresh everything.
add_action( 'edit_attachment', function () {
	ikonic_revalidate( array( 'projects', 'clients', 'team' ) );
} );

// ACF options page (Ikonic settings: proof numbers).
add_action( 'acf/save_post', function ( $post_id ) {
	if ( 'options' === $post_id || ( is_string( $post_id ) && str_starts_with( $post_id, 'options' ) ) ) {
		ikonic_revalidate( array( 'settings' ) );
	}
}, 20 );
