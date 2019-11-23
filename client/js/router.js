"use strict";

import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

import SignIn from "../components/Windows/SignIn.vue";
import Connect from "../components/Windows/Connect.vue";
import Settings from "../components/Windows/Settings.vue";
import Help from "../components/Windows/Help.vue";
import Changelog from "../components/Windows/Changelog.vue";
import NetworkEdit from "../components/Windows/NetworkEdit.vue";
import RoutedChat from "../components/RoutedChat.vue";
import constants from "./constants";
import store from "./store";

const router = new VueRouter({
	routes: [
		{
			name: "SignIn",
			path: "/sign-in",
			component: SignIn,
			beforeEnter(to, from, next) {
				// Prevent navigating to sign-in when already signed in
				if (store.state.appLoaded) {
					next(false);
					return;
				}

				next();
			},
		},
	],
});

router.beforeEach((to, from, next) => {
	// Disallow navigating to non-existing routes
	if (store.state.appLoaded && !to.matched.length) {
		next(false);
		return;
	}

	// Disallow navigating to invalid channels
	if (to.name === "RoutedChat" && !store.getters.findChannel(Number(to.params.id))) {
		next(false);
		return;
	}

	// Handle closing image viewer with the browser back button
	if (!router.app.$refs.app) {
		next();
		return;
	}

	const imageViewer = router.app.$root.$refs.app.$refs.imageViewer;

	if (imageViewer && imageViewer.link) {
		imageViewer.closeViewer();
		next(false);
		return;
	}

	next();
});

router.afterEach((to) => {
	if (store.state.appLoaded) {
		if (window.innerWidth <= constants.mobileViewportPixels) {
			store.commit("sidebarOpen", false);
		}
	}

	if (store.state.activeChannel) {
		const channel = store.state.activeChannel.channel;

		if (to.name !== "RoutedChat") {
			store.commit("activeChannel", null);
		}

		// When switching out of a channel, mark everything as read
		if (channel.messages.length > 0) {
			channel.firstUnread = channel.messages[channel.messages.length - 1].id;
		}

		if (channel.messages.length > 100) {
			channel.messages.splice(0, channel.messages.length - 100);
			channel.moreHistoryAvailable = true;
		}
	}
});

function initialize() {
	router.addRoutes([
		{
			name: "Connect",
			path: "/connect",
			component: Connect,
			props: (route) => ({queryParams: route.query}),
		},
		{
			name: "Settings",
			path: "/settings",
			component: Settings,
		},
		{
			name: "Help",
			path: "/help",
			component: Help,
		},
		{
			name: "Changelog",
			path: "/changelog",
			component: Changelog,
		},
		{
			name: "NetworkEdit",
			path: "/edit-network/:uuid",
			component: NetworkEdit,
		},
		{
			name: "RoutedChat",
			path: "/chan-:id",
			component: RoutedChat,
		},
	]);
}

function navigate(routeName, params = {}) {
	router.push({name: routeName, params}).catch(() => {});
}

function switchToChannel(channel) {
	return navigate("RoutedChat", {id: channel.id});
}

export {initialize, router, navigate, switchToChannel};
