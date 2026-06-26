package ws

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// WSService interface for WebSocket Hub
//
//go:generate go run go.uber.org/mock/mockgen -destination=../mocks/ws_mock.go -package=mocks github.com/user/bmscdc/internal/ws WSService
type WSService interface {
	HandleConnection(w http.ResponseWriter, r *http.Request, roomID string, userID string)
	BroadcastToRoom(roomID string, message interface{})
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all for now
	},
}

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	roomID string
	userID string
	send   chan interface{}
}

type Hub struct {
	clients    map[string]map[*Client]bool
	broadcast  chan struct {
		roomID  string
		message interface{}
	}
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		broadcast:  make(chan struct {
			roomID  string
			message interface{}
		}),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.clients[client.roomID] == nil {
				h.clients[client.roomID] = make(map[*Client]bool)
			}
			h.clients[client.roomID][client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.roomID][client]; ok {
				delete(h.clients[client.roomID], client)
				close(client.send)
				if len(h.clients[client.roomID]) == 0 {
					delete(h.clients, client.roomID)
				}
			}
			h.mu.Unlock()
		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients[message.roomID] {
				select {
				case client.send <- message.message:
				default:
					close(client.send)
					delete(h.clients[message.roomID], client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastToRoom(roomID string, message interface{}) {
	h.broadcast <- struct {
		roomID  string
		message interface{}
	}{roomID, message}
}

func (h *Hub) HandleConnection(w http.ResponseWriter, r *http.Request, roomID string, userID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	client := &Client{
		hub:    h,
		conn:   conn,
		roomID: roomID,
		userID: userID,
		send:   make(chan interface{}, 256),
	}
	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	for {
		var msg map[string]interface{}
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		// Based on the spec, host sends knock:accept / knock:deny
		// The HTTP handlers can actually handle these via REST API,
		// but if it comes through WS we can handle it here or route it.
		// For simplicity, we assume WS is for incoming events as per spec.
	}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteJSON(message); err != nil {
				return
			}
		}
	}
}
