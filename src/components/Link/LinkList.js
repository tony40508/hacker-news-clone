import React from 'react'
import styled from 'styled-components'
import axios from 'axios'

import LinkItem from './LinkItem'
import FirebaseContext from '../../firebase/context'
import { LINKS_PER_PAGE } from '../../utils/index'

function LinkList(props) {
  const { firebase } = React.useContext(FirebaseContext)
  const [links, setLinks] = React.useState([])
  const [cursor, setCursor] = React.useState(null)
  const [totalLinks, setTotalLinks] = React.useState(0)

  const isTopPage = props.location.pathname.includes('top')
  const isNewPage = props.location.pathname.includes('new')

  const page = Number(props.match.params.page)
  const pageIndex = page ? (page - 1) * LINKS_PER_PAGE + 1 : 0

  const handleSnapshot = snapshot => {
    const links = snapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      }
    })
    const LastLink = links[links.length - 1]
    setLinks(links)
    setCursor(LastLink)
  }

  const getTotalLinks = () => {
    axios
      .get(
        'https://us-central1-hacker-news-clone-d96d7.cloudfunctions.net/getTotalLinks'
      )
      .then(response => {
        setTotalLinks(response.data.length)
      })
  }

  const getLinks = () => {
    const hasCursor = Boolean(cursor)

    if (isTopPage) {
      return firebase.db
        .collection('links')
        .orderBy('voteCount', 'desc')
        .limit(LINKS_PER_PAGE)
        .onSnapshot(handleSnapshot)
    } else if (page === 1) {
      return firebase.db
        .collection('links')
        .orderBy('created', 'desc')
        .limit(LINKS_PER_PAGE)
        .onSnapshot(handleSnapshot)
    } else if (hasCursor) {
      return firebase.db
        .collection('links')
        .orderBy('created', 'desc')
        .startAfter(cursor.created)
        .limit(LINKS_PER_PAGE)
        .onSnapshot(handleSnapshot)
    } else {
      const offset = page * LINKS_PER_PAGE - LINKS_PER_PAGE
      axios
        .get(
          `https://us-central1-hacker-news-clone-d96d7.cloudfunctions.net/linkPagination?offset=${offset}`
        )
        .then(response => {
          const links = response.data
          const lastLink = links[links.length - 1]
          setLinks(links)
          setCursor(lastLink)
        })
      return () => {}
    }
  }

  const visitPreviousPage = () => {
    if (page > 1) {
      props.history.push(`/new/${page - 1}`)
    }
  }
  const visitNextPage = () => {
    if (page <= totalLinks / LINKS_PER_PAGE) {
      props.history.push(`/new/${page + 1}`)
    }
  }

  React.useEffect(() => {
    getTotalLinks()
  }, [])

  React.useEffect(() => {
    const unsubscribe = getLinks()
    return () => unsubscribe()
  }, [isTopPage, page])

  return (
    <>
      {links.map((link, index) => (
        <LinkItem
          key={link.id}
          showCount={true}
          link={link}
          index={index + pageIndex}
        />
      ))}
      {isNewPage && (
        <Pagination>
          <Pointer onClick={visitPreviousPage}>Previous</Pointer>
          <Pointer onClick={visitNextPage}>Next</Pointer>
        </Pagination>
      )}
    </>
  )
}

const Pagination = styled.div`
  margin-top: 1rem;
  margin-bottom: 1rem;
  margin-left: 2rem;
  color: #000;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
`

const Pointer = styled.div`
  margin-left: 1rem;
  &:hover {
    cursor: pointer;
  }
`

export default LinkList
